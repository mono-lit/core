import { c as escapeCellText, d as __toESM, l as stripDirectives, o as parseMarkdown, s as encodeDirective, t as DEFAULT_STYLES, u as __commonJSMin } from "./styles-BIJ31TM4.js";
import { n as isReadableSource, r as readAllRows } from "./data-source-read-DL88aH8t.js";
import { n as unwrapReactive } from "./reactive-D3EERqgO.js";
//#region src/export/download.ts
/**
* Browser download helper. Kept separate (and DOM-guarded) so the report engine
* can still render on a server — where `download()` is simply a no-op warning
* rather than a crash.
*/
/** MIME type per output format. */
var MIME = {
	md: "text/markdown;charset=utf-8",
	xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};
/** Save a Blob to disk via a transient `<a download>`. Browser only. */
function downloadBlob(blob, fileName) {
	if (typeof document === "undefined" || typeof URL?.createObjectURL !== "function") {
		console.warn("[mono-export] download() needs a browser environment — skipped.");
		return;
	}
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	anchor.style.display = "none";
	document.body.appendChild(anchor);
	anchor.click();
	document.body.removeChild(anchor);
	setTimeout(() => URL.revokeObjectURL(url), 0);
}
//#endregion
//#region src/export/detail.ts
function readPath(row, path) {
	if (path in row) return row[path];
	return path.split(".").reduce((acc, part) => acc == null ? acc : acc[part], row);
}
/**
* Run `task` over `items` with at most `limit` in flight.
*
* Deliberately NOT `Promise.all` over the whole list. The implementation this
* replaces fires every batch at once and wraps the lot in a single `.catch`, so
* one flaky request loses a multi-minute export and discards the error with it.
* Here a rejection is captured per item, and the rest of the workbook is still
* produced.
*
* The items are CHUNKS of master rows, not single documents — see the note at
* the top of this file.
*/
async function pool(items, limit, task) {
	const out = new Array(items.length);
	let cursor = 0;
	const worker = async () => {
		for (;;) {
			const index = cursor;
			cursor += 1;
			if (index >= items.length) return;
			try {
				out[index] = {
					status: "fulfilled",
					value: await task(items[index])
				};
			} catch (error) {
				out[index] = {
					status: "rejected",
					reason: error
				};
			}
		}
	};
	const size = Math.max(1, Math.min(limit, items.length));
	await Promise.all(Array.from({ length: size }, worker));
	return out;
}
/**
* Turn master rows into per-document detail rows.
*
* A document with no rows is reported in `skipped` rather than given an empty
* sheet — an empty worksheet behind a link is worse than no link, and the
* caller gets told which documents those were instead of having to diff the
* tab list.
*/
async function resolveDetails(masterRows, detail) {
	const rows = masterRows.filter((row) => !!row && typeof row === "object");
	const keyOf = (row) => String(readPath(row, detail.key) ?? "");
	const details = [];
	const skipped = [];
	const collect = (row, value) => {
		const key = keyOf(row);
		const list = Array.isArray(value) ? value : [];
		if (!key || !list.length) {
			skipped.push({
				key: key || "(no key)",
				reason: "empty"
			});
			return;
		}
		details.push({
			row,
			key,
			rows: list
		});
	};
	if (typeof detail.load === "function") {
		const size = Math.max(1, Math.floor(detail.loadChunk ?? 100));
		const chunks = [];
		for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
		const groupBy = detail.groupBy ?? detail.key;
		const groupOf = typeof groupBy === "function" ? groupBy : (row) => readPath(row, groupBy);
		(await pool(chunks, detail.concurrency ?? 4, (chunk) => Promise.resolve(detail.load({
			data: chunk,
			keys: [...new Set(chunk.map((row) => readPath(row, detail.key)))],
			key: detail.key
		})))).forEach((result, index) => {
			const chunk = chunks[index];
			if (result.status === "rejected") {
				for (const row of chunk) skipped.push({
					key: keyOf(row) || "(no key)",
					reason: "failed",
					error: result.reason
				});
				return;
			}
			const byKey = /* @__PURE__ */ new Map();
			for (const row of Array.isArray(result.value) ? result.value : []) {
				if (!row || typeof row !== "object") continue;
				const key = String(groupOf(row) ?? "");
				if (!key) continue;
				const bucket = byKey.get(key);
				if (bucket) bucket.push(row);
				else byKey.set(key, [row]);
			}
			for (const row of chunk) collect(row, byKey.get(keyOf(row)) ?? []);
		});
		return {
			details,
			skipped
		};
	}
	if (detail.field) {
		for (const row of rows) collect(row, readPath(row, detail.field));
		return {
			details,
			skipped
		};
	}
	throw new Error("[mono-export] `detail` needs either `field` or `load`.");
}
//#endregion
//#region src/export/resolve-data.ts
/**
* Turning live data sources in `options.data` into plain arrays.
*
* A template can only loop over an array, but the thing a consumer *has* is
* usually a devextreme DataSource. Rather than making everyone drain it by hand
* before every export, any DataSource-shaped value in `data` is drained here
* first — in chunks, honouring whatever filter / search / sort the source
* already carries — so the template just sees rows:
*
* ```ts
* data: { program: dataSourceProgramTransfer.value }
* ```
* ```hbs
* {{#each program}}| {{NoDokumen}} | {{currency TotalBudget}} |
* {{/each}}
* ```
*/
/**
* Replace every DataSource / store in `data`'s **top level** with its rows.
*
* Top-level only, deliberately: it's predictable, and a deep walk would mean
* inspecting every record of every array already in `data` — a real cost for a
* 10k-row export, to support a nesting nobody has asked for. A source nested
* deeper stays the caller's job (`await table.getData()` and pass the array).
*
* Sources are drained concurrently — several are independent queries, and a
* report with three of them shouldn't take three times as long.
*/
async function resolveExportData(data, options = {}) {
	if (!data) return {};
	const entries = Object.entries(data);
	const pending = [];
	const out = {};
	for (const [key, raw] of entries) {
		const value = unwrapReactive(raw);
		if (isReadableSource(value)) pending.push(readAllRows(value, { chunkSize: options.chunkSize }).then((rows) => {
			out[key] = rows;
		}));
		else out[key] = value;
	}
	if (pending.length) await Promise.all(pending);
	return out;
}
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/interopRequireDefault.js
var require_interopRequireDefault = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function _interopRequireDefault(e) {
		return e && e.__esModule ? e : { "default": e };
	}
	module.exports = _interopRequireDefault, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/typeof.js
var require_typeof = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function _typeof(o) {
		"@babel/helpers - typeof";
		return module.exports = _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, module.exports.__esModule = true, module.exports["default"] = module.exports, _typeof(o);
	}
	module.exports = _typeof, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/toPrimitive.js
var require_toPrimitive = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _typeof = require_typeof()["default"];
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	module.exports = toPrimitive, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/toPropertyKey.js
var require_toPropertyKey = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _typeof = require_typeof()["default"];
	var toPrimitive = require_toPrimitive();
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	module.exports = toPropertyKey, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/defineProperty.js
var require_defineProperty = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var toPropertyKey = require_toPropertyKey();
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	module.exports = _defineProperty, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/classCallCheck.js
var require_classCallCheck = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function _classCallCheck(a, n) {
		if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
	}
	module.exports = _classCallCheck, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/createClass.js
var require_createClass = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var toPropertyKey = require_toPropertyKey();
	function _defineProperties(e, r) {
		for (var t = 0; t < r.length; t++) {
			var o = r[t];
			o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, toPropertyKey(o.key), o);
		}
	}
	function _createClass(e, r, t) {
		return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e;
	}
	module.exports = _createClass, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/arrayLikeToArray.js
var require_arrayLikeToArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function _arrayLikeToArray(r, a) {
		(null == a || a > r.length) && (a = r.length);
		for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
		return n;
	}
	module.exports = _arrayLikeToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/arrayWithoutHoles.js
var require_arrayWithoutHoles = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var arrayLikeToArray = require_arrayLikeToArray();
	function _arrayWithoutHoles(r) {
		if (Array.isArray(r)) return arrayLikeToArray(r);
	}
	module.exports = _arrayWithoutHoles, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/iterableToArray.js
var require_iterableToArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function _iterableToArray(r) {
		if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
	}
	module.exports = _iterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/unsupportedIterableToArray.js
var require_unsupportedIterableToArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var arrayLikeToArray = require_arrayLikeToArray();
	function _unsupportedIterableToArray(r, a) {
		if (r) {
			if ("string" == typeof r) return arrayLikeToArray(r, a);
			var t = {}.toString.call(r).slice(8, -1);
			return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? arrayLikeToArray(r, a) : void 0;
		}
	}
	module.exports = _unsupportedIterableToArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/nonIterableSpread.js
var require_nonIterableSpread = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function _nonIterableSpread() {
		throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}
	module.exports = _nonIterableSpread, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@babel+runtime@7.26.10/node_modules/@babel/runtime/helpers/toConsumableArray.js
var require_toConsumableArray = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var arrayWithoutHoles = require_arrayWithoutHoles();
	var iterableToArray = require_iterableToArray();
	var unsupportedIterableToArray = require_unsupportedIterableToArray();
	var nonIterableSpread = require_nonIterableSpread();
	function _toConsumableArray(r) {
		return arrayWithoutHoles(r) || iterableToArray(r) || unsupportedIterableToArray(r) || nonIterableSpread();
	}
	module.exports = _toConsumableArray, module.exports.__esModule = true, module.exports["default"] = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/jexl@2.3.0/node_modules/jexl/dist/evaluator/handlers.js
var require_handlers$1 = /* @__PURE__ */ __commonJSMin(((exports) => {
	var _toConsumableArray2 = require_interopRequireDefault()(require_toConsumableArray());
	var poolNames = {
		functions: "Jexl Function",
		transforms: "Transform"
	};
	/**
	* Evaluates an ArrayLiteral by returning its value, with each element
	* independently run through the evaluator.
	* @param {{type: 'ObjectLiteral', value: <{}>}} ast An expression tree with an
	*      ObjectLiteral as the top node
	* @returns {Promise.<[]>} resolves to a map contained evaluated values.
	* @private
	*/
	exports.ArrayLiteral = function(ast) {
		return this.evalArray(ast.value);
	};
	/**
	* Evaluates a BinaryExpression node by running the Grammar's evaluator for
	* the given operator. Note that binary expressions support two types of
	* evaluators: `eval` is called with the left and right operands pre-evaluated.
	* `evalOnDemand`, if it exists, will be called with the left and right operands
	* each individually wrapped in an object with an "eval" function that returns
	* a promise with the resulting value. This allows the binary expression to
	* evaluate the operands conditionally.
	* @param {{type: 'BinaryExpression', operator: <string>, left: {},
	*      right: {}}} ast An expression tree with a BinaryExpression as the top
	*      node
	* @returns {Promise<*>} resolves with the value of the BinaryExpression.
	* @private
	*/
	exports.BinaryExpression = function(ast) {
		var _this = this;
		var grammarOp = this._grammar.elements[ast.operator];
		if (grammarOp.evalOnDemand) {
			var wrap = function wrap(subAst) {
				return { eval: function _eval() {
					return _this.eval(subAst);
				} };
			};
			return grammarOp.evalOnDemand(wrap(ast.left), wrap(ast.right));
		}
		return this.Promise.all([this.eval(ast.left), this.eval(ast.right)]).then(function(arr) {
			return grammarOp.eval(arr[0], arr[1]);
		});
	};
	/**
	* Evaluates a ConditionalExpression node by first evaluating its test branch,
	* and resolving with the consequent branch if the test is truthy, or the
	* alternate branch if it is not. If there is no consequent branch, the test
	* result will be used instead.
	* @param {{type: 'ConditionalExpression', test: {}, consequent: {},
	*      alternate: {}}} ast An expression tree with a ConditionalExpression as
	*      the top node
	* @private
	*/
	exports.ConditionalExpression = function(ast) {
		var _this2 = this;
		return this.eval(ast.test).then(function(res) {
			if (res) {
				if (ast.consequent) return _this2.eval(ast.consequent);
				return res;
			}
			return _this2.eval(ast.alternate);
		});
	};
	/**
	* Evaluates a FilterExpression by applying it to the subject value.
	* @param {{type: 'FilterExpression', relative: <boolean>, expr: {},
	*      subject: {}}} ast An expression tree with a FilterExpression as the top
	*      node
	* @returns {Promise<*>} resolves with the value of the FilterExpression.
	* @private
	*/
	exports.FilterExpression = function(ast) {
		var _this3 = this;
		return this.eval(ast.subject).then(function(subject) {
			if (ast.relative) return _this3._filterRelative(subject, ast.expr);
			return _this3._filterStatic(subject, ast.expr);
		});
	};
	/**
	* Evaluates an Identifier by either stemming from the evaluated 'from'
	* expression tree or accessing the context provided when this Evaluator was
	* constructed.
	* @param {{type: 'Identifier', value: <string>, [from]: {}}} ast An expression
	*      tree with an Identifier as the top node
	* @returns {Promise<*>|*} either the identifier's value, or a Promise that
	*      will resolve with the identifier's value.
	* @private
	*/
	exports.Identifier = function(ast) {
		if (!ast.from) return ast.relative ? this._relContext[ast.value] : this._context[ast.value];
		return this.eval(ast.from).then(function(context) {
			if (context === void 0 || context === null) return;
			if (Array.isArray(context)) context = context[0];
			return context[ast.value];
		});
	};
	/**
	* Evaluates a Literal by returning its value property.
	* @param {{type: 'Literal', value: <string|number|boolean>}} ast An expression
	*      tree with a Literal as its only node
	* @returns {string|number|boolean} The value of the Literal node
	* @private
	*/
	exports.Literal = function(ast) {
		return ast.value;
	};
	/**
	* Evaluates an ObjectLiteral by returning its value, with each key
	* independently run through the evaluator.
	* @param {{type: 'ObjectLiteral', value: <{}>}} ast An expression tree with an
	*      ObjectLiteral as the top node
	* @returns {Promise<{}>} resolves to a map contained evaluated values.
	* @private
	*/
	exports.ObjectLiteral = function(ast) {
		return this.evalMap(ast.value);
	};
	/**
	* Evaluates a FunctionCall node by applying the supplied arguments to a
	* function defined in one of the grammar's function pools.
	* @param {{type: 'FunctionCall', name: <string>}} ast An
	*      expression tree with a FunctionCall as the top node
	* @returns {Promise<*>|*} the value of the function call, or a Promise that
	*      will resolve with the resulting value.
	* @private
	*/
	exports.FunctionCall = function(ast) {
		var poolName = poolNames[ast.pool];
		if (!poolName) throw new Error("Corrupt AST: Pool '".concat(ast.pool, "' not found"));
		var func = this._grammar[ast.pool][ast.name];
		if (!func) throw new Error("".concat(poolName, " ").concat(ast.name, " is not defined."));
		return this.evalArray(ast.args || []).then(function(args) {
			return func.apply(void 0, (0, _toConsumableArray2.default)(args));
		});
	};
	/**
	* Evaluates a Unary expression by passing the right side through the
	* operator's eval function.
	* @param {{type: 'UnaryExpression', operator: <string>, right: {}}} ast An
	*      expression tree with a UnaryExpression as the top node
	* @returns {Promise<*>} resolves with the value of the UnaryExpression.
	* @constructor
	*/
	exports.UnaryExpression = function(ast) {
		var _this4 = this;
		return this.eval(ast.right).then(function(right) {
			return _this4._grammar.elements[ast.operator].eval(right);
		});
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jexl@2.3.0/node_modules/jexl/dist/evaluator/Evaluator.js
var require_Evaluator = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _classCallCheck2 = _interopRequireDefault(require_classCallCheck());
	var _createClass2 = _interopRequireDefault(require_createClass());
	var handlers = require_handlers$1();
	module.exports = /* @__PURE__ */ function() {
		function Evaluator(grammar, context, relativeContext) {
			var promise = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : Promise;
			(0, _classCallCheck2.default)(this, Evaluator);
			this._grammar = grammar;
			this._context = context || {};
			this._relContext = relativeContext || this._context;
			this.Promise = promise;
		}
		/**
		* Evaluates an expression tree within the configured context.
		* @param {{}} ast An expression tree object
		* @returns {Promise<*>} resolves with the resulting value of the expression.
		*/
		(0, _createClass2.default)(Evaluator, [
			{
				key: "eval",
				value: function _eval(ast) {
					var _this = this;
					return this.Promise.resolve().then(function() {
						return handlers[ast.type].call(_this, ast);
					});
				}
			},
			{
				key: "evalArray",
				value: function evalArray(arr) {
					var _this2 = this;
					return this.Promise.all(arr.map(function(elem) {
						return _this2.eval(elem);
					}));
				}
			},
			{
				key: "evalMap",
				value: function evalMap(map) {
					var _this3 = this;
					var keys = Object.keys(map);
					var result = {};
					var asts = keys.map(function(key) {
						return _this3.eval(map[key]);
					});
					return this.Promise.all(asts).then(function(vals) {
						vals.forEach(function(val, idx) {
							result[keys[idx]] = val;
						});
						return result;
					});
				}
			},
			{
				key: "_filterRelative",
				value: function _filterRelative(subject, expr) {
					var _this4 = this;
					var promises = [];
					if (!Array.isArray(subject)) subject = subject === void 0 ? [] : [subject];
					subject.forEach(function(elem) {
						var evalInst = new Evaluator(_this4._grammar, _this4._context, elem, _this4.Promise);
						promises.push(evalInst.eval(expr));
					});
					return this.Promise.all(promises).then(function(values) {
						var results = [];
						values.forEach(function(value, idx) {
							if (value) results.push(subject[idx]);
						});
						return results;
					});
				}
			},
			{
				key: "_filterStatic",
				value: function _filterStatic(subject, expr) {
					return this.eval(expr).then(function(res) {
						if (typeof res === "boolean") return res ? subject : void 0;
						return subject[res];
					});
				}
			}
		]);
		return Evaluator;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/jexl@2.3.0/node_modules/jexl/dist/Lexer.js
var require_Lexer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _classCallCheck2 = _interopRequireDefault(require_classCallCheck());
	var _createClass2 = _interopRequireDefault(require_createClass());
	var numericRegex = /^-?(?:(?:[0-9]*\.[0-9]+)|[0-9]+)$/;
	var identRegex = /^[a-zA-Zа-яА-Я_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF$][a-zA-Zа-яА-Я0-9_\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF$]*$/;
	var escEscRegex = /\\\\/;
	var whitespaceRegex = /^\s*$/;
	var preOpRegexElems = [
		"'(?:(?:\\\\')|[^'])*'",
		"\"(?:(?:\\\\\")|[^\"])*\"",
		"\\s+",
		"\\btrue\\b",
		"\\bfalse\\b"
	];
	var postOpRegexElems = ["[a-zA-Zа-яА-Я_À-ÖØ-öø-ÿ\\$][a-zA-Z0-9а-яА-Я_À-ÖØ-öø-ÿ\\$]*", "(?:(?:[0-9]*\\.[0-9]+)|[0-9]+)"];
	var minusNegatesAfter = [
		"binaryOp",
		"unaryOp",
		"openParen",
		"openBracket",
		"question",
		"colon"
	];
	module.exports = /* @__PURE__ */ function() {
		function Lexer(grammar) {
			(0, _classCallCheck2.default)(this, Lexer);
			this._grammar = grammar;
		}
		/**
		* Splits a Jexl expression string into an array of expression elements.
		* @param {string} str A Jexl expression string
		* @returns {Array<string>} An array of substrings defining the functional
		*      elements of the expression.
		*/
		(0, _createClass2.default)(Lexer, [
			{
				key: "getElements",
				value: function getElements(str) {
					var regex = this._getSplitRegex();
					return str.split(regex).filter(function(elem) {
						return elem;
					});
				}
			},
			{
				key: "getTokens",
				value: function getTokens(elements) {
					var tokens = [];
					var negate = false;
					for (var i = 0; i < elements.length; i++) if (this._isWhitespace(elements[i])) {
						if (tokens.length) tokens[tokens.length - 1].raw += elements[i];
					} else if (elements[i] === "-" && this._isNegative(tokens)) negate = true;
					else {
						if (negate) {
							elements[i] = "-" + elements[i];
							negate = false;
						}
						tokens.push(this._createToken(elements[i]));
					}
					if (negate) tokens.push(this._createToken("-"));
					return tokens;
				}
			},
			{
				key: "tokenize",
				value: function tokenize(str) {
					var elements = this.getElements(str);
					return this.getTokens(elements);
				}
			},
			{
				key: "_createToken",
				value: function _createToken(element) {
					var token = {
						type: "literal",
						value: element,
						raw: element
					};
					if (element[0] === "\"" || element[0] === "'") token.value = this._unquote(element);
					else if (element.match(numericRegex)) token.value = parseFloat(element);
					else if (element === "true" || element === "false") token.value = element === "true";
					else if (this._grammar.elements[element]) token.type = this._grammar.elements[element].type;
					else if (element.match(identRegex)) token.type = "identifier";
					else throw new Error("Invalid expression token: ".concat(element));
					return token;
				}
			},
			{
				key: "_escapeRegExp",
				value: function _escapeRegExp(str) {
					str = str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
					if (str.match(identRegex)) str = "\\b" + str + "\\b";
					return str;
				}
			},
			{
				key: "_getSplitRegex",
				value: function _getSplitRegex() {
					var _this = this;
					if (!this._splitRegex) {
						var elemArray = Object.keys(this._grammar.elements).sort(function(a, b) {
							return b.length - a.length;
						}).map(function(elem) {
							return _this._escapeRegExp(elem);
						}, this);
						this._splitRegex = new RegExp("(" + [
							preOpRegexElems.join("|"),
							elemArray.join("|"),
							postOpRegexElems.join("|")
						].join("|") + ")");
					}
					return this._splitRegex;
				}
			},
			{
				key: "_isNegative",
				value: function _isNegative(tokens) {
					if (!tokens.length) return true;
					return minusNegatesAfter.some(function(type) {
						return type === tokens[tokens.length - 1].type;
					});
				}
			},
			{
				key: "_isWhitespace",
				value: function _isWhitespace(str) {
					return !!str.match(whitespaceRegex);
				}
			},
			{
				key: "_unquote",
				value: function _unquote(str) {
					var quote = str[0];
					var escQuoteRegex = new RegExp("\\\\" + quote, "g");
					return str.substr(1, str.length - 2).replace(escQuoteRegex, quote).replace(escEscRegex, "\\");
				}
			}
		]);
		return Lexer;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/jexl@2.3.0/node_modules/jexl/dist/parser/handlers.js
var require_handlers = /* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* Handles a subexpression that's used to define a transform argument's value.
	* @param {{type: <string>}} ast The subexpression tree
	*/
	exports.argVal = function(ast) {
		if (ast) this._cursor.args.push(ast);
	};
	/**
	* Handles new array literals by adding them as a new node in the AST,
	* initialized with an empty array.
	*/
	exports.arrayStart = function() {
		this._placeAtCursor({
			type: "ArrayLiteral",
			value: []
		});
	};
	/**
	* Handles a subexpression representing an element of an array literal.
	* @param {{type: <string>}} ast The subexpression tree
	*/
	exports.arrayVal = function(ast) {
		if (ast) this._cursor.value.push(ast);
	};
	/**
	* Handles tokens of type 'binaryOp', indicating an operation that has two
	* inputs: a left side and a right side.
	* @param {{type: <string>}} token A token object
	*/
	exports.binaryOp = function(token) {
		var precedence = this._grammar.elements[token.value].precedence || 0;
		var parent = this._cursor._parent;
		while (parent && parent.operator && this._grammar.elements[parent.operator].precedence >= precedence) {
			this._cursor = parent;
			parent = parent._parent;
		}
		var node = {
			type: "BinaryExpression",
			operator: token.value,
			left: this._cursor
		};
		this._setParent(this._cursor, node);
		this._cursor = parent;
		this._placeAtCursor(node);
	};
	/**
	* Handles successive nodes in an identifier chain.  More specifically, it
	* sets values that determine how the following identifier gets placed in the
	* AST.
	*/
	exports.dot = function() {
		this._nextIdentEncapsulate = this._cursor && this._cursor.type !== "UnaryExpression" && (this._cursor.type !== "BinaryExpression" || this._cursor.type === "BinaryExpression" && this._cursor.right);
		this._nextIdentRelative = !this._cursor || this._cursor && !this._nextIdentEncapsulate;
		if (this._nextIdentRelative) this._relative = true;
	};
	/**
	* Handles a subexpression used for filtering an array returned by an
	* identifier chain.
	* @param {{type: <string>}} ast The subexpression tree
	*/
	exports.filter = function(ast) {
		this._placeBeforeCursor({
			type: "FilterExpression",
			expr: ast,
			relative: this._subParser.isRelative(),
			subject: this._cursor
		});
	};
	/**
	* Handles identifier tokens when used to indicate the name of a function to
	* be called.
	* @param {{type: <string>}} token A token object
	*/
	exports.functionCall = function() {
		this._placeBeforeCursor({
			type: "FunctionCall",
			name: this._cursor.value,
			args: [],
			pool: "functions"
		});
	};
	/**
	* Handles identifier tokens by adding them as a new node in the AST.
	* @param {{type: <string>}} token A token object
	*/
	exports.identifier = function(token) {
		var node = {
			type: "Identifier",
			value: token.value
		};
		if (this._nextIdentEncapsulate) {
			node.from = this._cursor;
			this._placeBeforeCursor(node);
			this._nextIdentEncapsulate = false;
		} else {
			if (this._nextIdentRelative) {
				node.relative = true;
				this._nextIdentRelative = false;
			}
			this._placeAtCursor(node);
		}
	};
	/**
	* Handles literal values, such as strings, booleans, and numerics, by adding
	* them as a new node in the AST.
	* @param {{type: <string>}} token A token object
	*/
	exports.literal = function(token) {
		this._placeAtCursor({
			type: "Literal",
			value: token.value
		});
	};
	/**
	* Queues a new object literal key to be written once a value is collected.
	* @param {{type: <string>}} token A token object
	*/
	exports.objKey = function(token) {
		this._curObjKey = token.value;
	};
	/**
	* Handles new object literals by adding them as a new node in the AST,
	* initialized with an empty object.
	*/
	exports.objStart = function() {
		this._placeAtCursor({
			type: "ObjectLiteral",
			value: {}
		});
	};
	/**
	* Handles an object value by adding its AST to the queued key on the object
	* literal node currently at the cursor.
	* @param {{type: <string>}} ast The subexpression tree
	*/
	exports.objVal = function(ast) {
		this._cursor.value[this._curObjKey] = ast;
	};
	/**
	* Handles traditional subexpressions, delineated with the groupStart and
	* groupEnd elements.
	* @param {{type: <string>}} ast The subexpression tree
	*/
	exports.subExpression = function(ast) {
		this._placeAtCursor(ast);
	};
	/**
	* Handles a completed alternate subexpression of a ternary operator.
	* @param {{type: <string>}} ast The subexpression tree
	*/
	exports.ternaryEnd = function(ast) {
		this._cursor.alternate = ast;
	};
	/**
	* Handles a completed consequent subexpression of a ternary operator.
	* @param {{type: <string>}} ast The subexpression tree
	*/
	exports.ternaryMid = function(ast) {
		this._cursor.consequent = ast;
	};
	/**
	* Handles the start of a new ternary expression by encapsulating the entire
	* AST in a ConditionalExpression node, and using the existing tree as the
	* test element.
	*/
	exports.ternaryStart = function() {
		this._tree = {
			type: "ConditionalExpression",
			test: this._tree
		};
		this._cursor = this._tree;
	};
	/**
	* Handles identifier tokens when used to indicate the name of a transform to
	* be applied.
	* @param {{type: <string>}} token A token object
	*/
	exports.transform = function(token) {
		this._placeBeforeCursor({
			type: "FunctionCall",
			name: token.value,
			args: [this._cursor],
			pool: "transforms"
		});
	};
	/**
	* Handles token of type 'unaryOp', indicating that the operation has only
	* one input: a right side.
	* @param {{type: <string>}} token A token object
	*/
	exports.unaryOp = function(token) {
		this._placeAtCursor({
			type: "UnaryExpression",
			operator: token.value
		});
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jexl@2.3.0/node_modules/jexl/dist/parser/states.js
var require_states = /* @__PURE__ */ __commonJSMin(((exports) => {
	var h = require_handlers();
	/**
	* A mapping of all states in the finite state machine to a set of instructions
	* for handling or transitioning into other states. Each state can be handled
	* in one of two schemes: a tokenType map, or a subHandler.
	*
	* Standard expression elements are handled through the tokenType object. This
	* is an object map of all legal token types to encounter in this state (and
	* any unexpected token types will generate a thrown error) to an options
	* object that defines how they're handled.  The available options are:
	*
	*      {string} toState: The name of the state to which to transition
	*          immediately after handling this token
	*      {string} handler: The handler function to call when this token type is
	*          encountered in this state.  If omitted, the default handler
	*          matching the token's "type" property will be called. If the handler
	*          function does not exist, no call will be made and no error will be
	*          generated.  This is useful for tokens whose sole purpose is to
	*          transition to other states.
	*
	* States that consume a subexpression should define a subHandler, the
	* function to be called with an expression tree argument when the
	* subexpression is complete. Completeness is determined through the
	* endStates object, which maps tokens on which an expression should end to the
	* state to which to transition once the subHandler function has been called.
	*
	* Additionally, any state in which it is legal to mark the AST as completed
	* should have a 'completable' property set to boolean true.  Attempting to
	* call {@link Parser#complete} in any state without this property will result
	* in a thrown Error.
	*
	* @type {{}}
	*/
	exports.states = {
		expectOperand: { tokenTypes: {
			literal: { toState: "expectBinOp" },
			identifier: { toState: "identifier" },
			unaryOp: {},
			openParen: { toState: "subExpression" },
			openCurl: {
				toState: "expectObjKey",
				handler: h.objStart
			},
			dot: { toState: "traverse" },
			openBracket: {
				toState: "arrayVal",
				handler: h.arrayStart
			}
		} },
		expectBinOp: {
			tokenTypes: {
				binaryOp: { toState: "expectOperand" },
				pipe: { toState: "expectTransform" },
				dot: { toState: "traverse" },
				question: {
					toState: "ternaryMid",
					handler: h.ternaryStart
				}
			},
			completable: true
		},
		expectTransform: { tokenTypes: { identifier: {
			toState: "postTransform",
			handler: h.transform
		} } },
		expectObjKey: { tokenTypes: {
			identifier: {
				toState: "expectKeyValSep",
				handler: h.objKey
			},
			closeCurl: { toState: "expectBinOp" }
		} },
		expectKeyValSep: { tokenTypes: { colon: { toState: "objVal" } } },
		postTransform: {
			tokenTypes: {
				openParen: { toState: "argVal" },
				binaryOp: { toState: "expectOperand" },
				dot: { toState: "traverse" },
				openBracket: { toState: "filter" },
				pipe: { toState: "expectTransform" }
			},
			completable: true
		},
		postArgs: {
			tokenTypes: {
				binaryOp: { toState: "expectOperand" },
				dot: { toState: "traverse" },
				openBracket: { toState: "filter" },
				pipe: { toState: "expectTransform" }
			},
			completable: true
		},
		identifier: {
			tokenTypes: {
				binaryOp: { toState: "expectOperand" },
				dot: { toState: "traverse" },
				openBracket: { toState: "filter" },
				openParen: {
					toState: "argVal",
					handler: h.functionCall
				},
				pipe: { toState: "expectTransform" },
				question: {
					toState: "ternaryMid",
					handler: h.ternaryStart
				}
			},
			completable: true
		},
		traverse: { tokenTypes: { identifier: { toState: "identifier" } } },
		filter: {
			subHandler: h.filter,
			endStates: { closeBracket: "identifier" }
		},
		subExpression: {
			subHandler: h.subExpression,
			endStates: { closeParen: "expectBinOp" }
		},
		argVal: {
			subHandler: h.argVal,
			endStates: {
				comma: "argVal",
				closeParen: "postArgs"
			}
		},
		objVal: {
			subHandler: h.objVal,
			endStates: {
				comma: "expectObjKey",
				closeCurl: "expectBinOp"
			}
		},
		arrayVal: {
			subHandler: h.arrayVal,
			endStates: {
				comma: "arrayVal",
				closeBracket: "expectBinOp"
			}
		},
		ternaryMid: {
			subHandler: h.ternaryMid,
			endStates: { colon: "ternaryEnd" }
		},
		ternaryEnd: {
			subHandler: h.ternaryEnd,
			completable: true
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/jexl@2.3.0/node_modules/jexl/dist/parser/Parser.js
var require_Parser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _classCallCheck2 = _interopRequireDefault(require_classCallCheck());
	var _createClass2 = _interopRequireDefault(require_createClass());
	var handlers = require_handlers();
	var states = require_states().states;
	module.exports = /* @__PURE__ */ function() {
		function Parser(grammar, prefix, stopMap) {
			(0, _classCallCheck2.default)(this, Parser);
			this._grammar = grammar;
			this._state = "expectOperand";
			this._tree = null;
			this._exprStr = prefix || "";
			this._relative = false;
			this._stopMap = stopMap || {};
		}
		/**
		* Processes a new token into the AST and manages the transitions of the state
		* machine.
		* @param {{type: <string>}} token A token object, as provided by the
		*      {@link Lexer#tokenize} function.
		* @throws {Error} if a token is added when the Parser has been marked as
		*      complete by {@link #complete}, or if an unexpected token type is added.
		* @returns {boolean|*} the stopState value if this parser encountered a token
		*      in the stopState mapb false if tokens can continue.
		*/
		(0, _createClass2.default)(Parser, [
			{
				key: "addToken",
				value: function addToken(token) {
					if (this._state === "complete") throw new Error("Cannot add a new token to a completed Parser");
					var state = states[this._state];
					var startExpr = this._exprStr;
					this._exprStr += token.raw;
					if (state.subHandler) {
						if (!this._subParser) this._startSubExpression(startExpr);
						var stopState = this._subParser.addToken(token);
						if (stopState) {
							this._endSubExpression();
							if (this._parentStop) return stopState;
							this._state = stopState;
						}
					} else if (state.tokenTypes[token.type]) {
						var typeOpts = state.tokenTypes[token.type];
						var handleFunc = handlers[token.type];
						if (typeOpts.handler) handleFunc = typeOpts.handler;
						if (handleFunc) handleFunc.call(this, token);
						if (typeOpts.toState) this._state = typeOpts.toState;
					} else if (this._stopMap[token.type]) return this._stopMap[token.type];
					else throw new Error("Token ".concat(token.raw, " (").concat(token.type, ") unexpected in expression: ").concat(this._exprStr));
					return false;
				}
			},
			{
				key: "addTokens",
				value: function addTokens(tokens) {
					tokens.forEach(this.addToken, this);
				}
			},
			{
				key: "complete",
				value: function complete() {
					if (this._cursor && !states[this._state].completable) throw new Error("Unexpected end of expression: ".concat(this._exprStr));
					if (this._subParser) this._endSubExpression();
					this._state = "complete";
					return this._cursor ? this._tree : null;
				}
			},
			{
				key: "isRelative",
				value: function isRelative() {
					return this._relative;
				}
			},
			{
				key: "_endSubExpression",
				value: function _endSubExpression() {
					states[this._state].subHandler.call(this, this._subParser.complete());
					this._subParser = null;
				}
			},
			{
				key: "_placeAtCursor",
				value: function _placeAtCursor(node) {
					if (!this._cursor) this._tree = node;
					else {
						this._cursor.right = node;
						this._setParent(node, this._cursor);
					}
					this._cursor = node;
				}
			},
			{
				key: "_placeBeforeCursor",
				value: function _placeBeforeCursor(node) {
					this._cursor = this._cursor._parent;
					this._placeAtCursor(node);
				}
			},
			{
				key: "_setParent",
				value: function _setParent(node, parent) {
					Object.defineProperty(node, "_parent", {
						value: parent,
						writable: true
					});
				}
			},
			{
				key: "_startSubExpression",
				value: function _startSubExpression(exprStr) {
					var endStates = states[this._state].endStates;
					if (!endStates) {
						this._parentStop = true;
						endStates = this._stopMap;
					}
					this._subParser = new Parser(this._grammar, exprStr, endStates);
				}
			}
		]);
		return Parser;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/jexl@2.3.0/node_modules/jexl/dist/PromiseSync.js
var require_PromiseSync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _classCallCheck2 = _interopRequireDefault(require_classCallCheck());
	var _createClass2 = _interopRequireDefault(require_createClass());
	var PromiseSync = /*#__PURE__*/ function() {
		function PromiseSync(fn) {
			(0, _classCallCheck2.default)(this, PromiseSync);
			fn(this._resolve.bind(this), this._reject.bind(this));
		}
		(0, _createClass2.default)(PromiseSync, [
			{
				key: "catch",
				value: function _catch(rejected) {
					if (this.error) try {
						this._resolve(rejected(this.error));
					} catch (e) {
						this._reject(e);
					}
					return this;
				}
			},
			{
				key: "then",
				value: function then(resolved, rejected) {
					if (!this.error) try {
						this._resolve(resolved(this.value));
					} catch (e) {
						this._reject(e);
					}
					if (rejected) this.catch(rejected);
					return this;
				}
			},
			{
				key: "_reject",
				value: function _reject(error) {
					this.value = void 0;
					this.error = error;
				}
			},
			{
				key: "_resolve",
				value: function _resolve(val) {
					if (val instanceof PromiseSync) if (val.error) this._reject(val.error);
					else this._resolve(val.value);
					else {
						this.value = val;
						this.error = void 0;
					}
				}
			}
		]);
		return PromiseSync;
	}();
	PromiseSync.all = function(vals) {
		return new PromiseSync(function(resolve) {
			resolve(vals.map(function(val) {
				while (val instanceof PromiseSync) {
					if (val.error) throw Error(val.error);
					val = val.value;
				}
				return val;
			}));
		});
	};
	PromiseSync.resolve = function(val) {
		return new PromiseSync(function(resolve) {
			return resolve(val);
		});
	};
	PromiseSync.reject = function(error) {
		return new PromiseSync(function(resolve, reject) {
			return reject(error);
		});
	};
	module.exports = PromiseSync;
}));
//#endregion
//#region ../../node_modules/.pnpm/jexl@2.3.0/node_modules/jexl/dist/Expression.js
var require_Expression = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _classCallCheck2 = _interopRequireDefault(require_classCallCheck());
	var _createClass2 = _interopRequireDefault(require_createClass());
	var Evaluator = require_Evaluator();
	var Lexer = require_Lexer();
	var Parser = require_Parser();
	var PromiseSync = require_PromiseSync();
	module.exports = /* @__PURE__ */ function() {
		function Expression(grammar, exprStr) {
			(0, _classCallCheck2.default)(this, Expression);
			this._grammar = grammar;
			this._exprStr = exprStr;
			this._ast = null;
		}
		/**
		* Forces a compilation of the expression string that this Expression object
		* was constructed with. This function can be called multiple times; useful
		* if the language elements of the associated Jexl instance change.
		* @returns {Expression} this Expression instance, for convenience
		*/
		(0, _createClass2.default)(Expression, [
			{
				key: "compile",
				value: function compile() {
					var lexer = new Lexer(this._grammar);
					var parser = new Parser(this._grammar);
					var tokens = lexer.tokenize(this._exprStr);
					parser.addTokens(tokens);
					this._ast = parser.complete();
					return this;
				}
			},
			{
				key: "eval",
				value: function _eval() {
					var context = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
					return this._eval(context, Promise);
				}
			},
			{
				key: "evalSync",
				value: function evalSync() {
					var context = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
					var res = this._eval(context, PromiseSync);
					if (res.error) throw res.error;
					return res.value;
				}
			},
			{
				key: "_eval",
				value: function _eval(context, promise) {
					var _this = this;
					return promise.resolve().then(function() {
						var ast = _this._getAst();
						return new Evaluator(_this._grammar, context, void 0, promise).eval(ast);
					});
				}
			},
			{
				key: "_getAst",
				value: function _getAst() {
					if (!this._ast) this.compile();
					return this._ast;
				}
			}
		]);
		return Expression;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/jexl@2.3.0/node_modules/jexl/dist/grammar.js
var require_grammar = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.getGrammar = function() {
		return {
			/**
			* A map of all expression elements to their properties. Note that changes
			* here may require changes in the Lexer or Parser.
			* @type {{}}
			*/
			elements: {
				".": { type: "dot" },
				"[": { type: "openBracket" },
				"]": { type: "closeBracket" },
				"|": { type: "pipe" },
				"{": { type: "openCurl" },
				"}": { type: "closeCurl" },
				":": { type: "colon" },
				",": { type: "comma" },
				"(": { type: "openParen" },
				")": { type: "closeParen" },
				"?": { type: "question" },
				"+": {
					type: "binaryOp",
					precedence: 30,
					eval: function _eval(left, right) {
						return left + right;
					}
				},
				"-": {
					type: "binaryOp",
					precedence: 30,
					eval: function _eval(left, right) {
						return left - right;
					}
				},
				"*": {
					type: "binaryOp",
					precedence: 40,
					eval: function _eval(left, right) {
						return left * right;
					}
				},
				"/": {
					type: "binaryOp",
					precedence: 40,
					eval: function _eval(left, right) {
						return left / right;
					}
				},
				"//": {
					type: "binaryOp",
					precedence: 40,
					eval: function _eval(left, right) {
						return Math.floor(left / right);
					}
				},
				"%": {
					type: "binaryOp",
					precedence: 50,
					eval: function _eval(left, right) {
						return left % right;
					}
				},
				"^": {
					type: "binaryOp",
					precedence: 50,
					eval: function _eval(left, right) {
						return Math.pow(left, right);
					}
				},
				"==": {
					type: "binaryOp",
					precedence: 20,
					eval: function _eval(left, right) {
						return left == right;
					}
				},
				"!=": {
					type: "binaryOp",
					precedence: 20,
					eval: function _eval(left, right) {
						return left != right;
					}
				},
				">": {
					type: "binaryOp",
					precedence: 20,
					eval: function _eval(left, right) {
						return left > right;
					}
				},
				">=": {
					type: "binaryOp",
					precedence: 20,
					eval: function _eval(left, right) {
						return left >= right;
					}
				},
				"<": {
					type: "binaryOp",
					precedence: 20,
					eval: function _eval(left, right) {
						return left < right;
					}
				},
				"<=": {
					type: "binaryOp",
					precedence: 20,
					eval: function _eval(left, right) {
						return left <= right;
					}
				},
				"&&": {
					type: "binaryOp",
					precedence: 10,
					evalOnDemand: function evalOnDemand(left, right) {
						return left.eval().then(function(leftVal) {
							if (!leftVal) return leftVal;
							return right.eval();
						});
					}
				},
				"||": {
					type: "binaryOp",
					precedence: 10,
					evalOnDemand: function evalOnDemand(left, right) {
						return left.eval().then(function(leftVal) {
							if (leftVal) return leftVal;
							return right.eval();
						});
					}
				},
				in: {
					type: "binaryOp",
					precedence: 20,
					eval: function _eval(left, right) {
						if (typeof right === "string") return right.indexOf(left) !== -1;
						if (Array.isArray(right)) return right.some(function(elem) {
							return elem === left;
						});
						return false;
					}
				},
				"!": {
					type: "unaryOp",
					precedence: Infinity,
					eval: function _eval(right) {
						return !right;
					}
				}
			},
			/**
			* A map of function names to javascript functions. A Jexl function
			* takes zero ore more arguemnts:
			*
			*     - {*} ...args: A variable number of arguments passed to this function.
			*       All of these are pre-evaluated to their actual values before calling
			*       the function.
			*
			* The Jexl function should return either the transformed value, or
			* a Promises/A+ Promise object that resolves with the value and rejects
			* or throws only when an unrecoverable error occurs. Functions should
			* generally return undefined when they don't make sense to be used on the
			* given value type, rather than throw/reject. An error is only
			* appropriate when the function would normally return a value, but
			* cannot due to some other failure.
			*/
			functions: {},
			/**
			* A map of transform names to transform functions. A transform function
			* takes one ore more arguemnts:
			*
			*     - {*} val: A value to be transformed
			*     - {*} ...args: A variable number of arguments passed to this transform.
			*       All of these are pre-evaluated to their actual values before calling
			*       the function.
			*
			* The transform function should return either the transformed value, or
			* a Promises/A+ Promise object that resolves with the value and rejects
			* or throws only when an unrecoverable error occurs. Transforms should
			* generally return undefined when they don't make sense to be used on the
			* given value type, rather than throw/reject. An error is only
			* appropriate when the transform would normally return a value, but
			* cannot due to some other failure.
			*/
			transforms: {}
		};
	};
}));
//#endregion
//#region src/export/expression.ts
var import_Jexl = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var _interopRequireDefault = require_interopRequireDefault();
	var _defineProperty2 = _interopRequireDefault(require_defineProperty());
	var _classCallCheck2 = _interopRequireDefault(require_classCallCheck());
	var _createClass2 = _interopRequireDefault(require_createClass());
	var Expression = require_Expression();
	var getGrammar = require_grammar().getGrammar;
	/**
	* Jexl is the Javascript Expression Language, capable of parsing and
	* evaluating basic to complex expression strings, combined with advanced
	* xpath-like drilldown into native Javascript objects.
	* @constructor
	*/
	var Jexl = /*#__PURE__*/ function() {
		function Jexl() {
			(0, _classCallCheck2.default)(this, Jexl);
			this.expr = this.expr.bind(this);
			this._grammar = getGrammar();
		}
		/**
		* Adds a binary operator to Jexl at the specified precedence. The higher the
		* precedence, the earlier the operator is applied in the order of operations.
		* For example, * has a higher precedence than +, because multiplication comes
		* before division.
		*
		* Please see grammar.js for a listing of all default operators and their
		* precedence values in order to choose the appropriate precedence for the
		* new operator.
		* @param {string} operator The operator string to be added
		* @param {number} precedence The operator's precedence
		* @param {function} fn A function to run to calculate the result. The function
		*      will be called with two arguments: left and right, denoting the values
		*      on either side of the operator. It should return either the resulting
		*      value, or a Promise that resolves with the resulting value.
		* @param {boolean} [manualEval] If true, the `left` and `right` arguments
		*      will be wrapped in objects with an `eval` function. Calling
		*      left.eval() or right.eval() will return a promise that resolves to
		*      that operand's actual value. This is useful to conditionally evaluate
		*      operands.
		*/
		(0, _createClass2.default)(Jexl, [
			{
				key: "addBinaryOp",
				value: function addBinaryOp(operator, precedence, fn, manualEval) {
					this._addGrammarElement(operator, (0, _defineProperty2.default)({
						type: "binaryOp",
						precedence
					}, manualEval ? "evalOnDemand" : "eval", fn));
				}
			},
			{
				key: "addFunction",
				value: function addFunction(name, fn) {
					this._grammar.functions[name] = fn;
				}
			},
			{
				key: "addFunctions",
				value: function addFunctions(map) {
					for (var key in map) this._grammar.functions[key] = map[key];
				}
			},
			{
				key: "addUnaryOp",
				value: function addUnaryOp(operator, fn) {
					this._addGrammarElement(operator, {
						type: "unaryOp",
						weight: Infinity,
						eval: fn
					});
				}
			},
			{
				key: "addTransform",
				value: function addTransform(name, fn) {
					this._grammar.transforms[name] = fn;
				}
			},
			{
				key: "addTransforms",
				value: function addTransforms(map) {
					for (var key in map) this._grammar.transforms[key] = map[key];
				}
			},
			{
				key: "compile",
				value: function compile(expression) {
					return this.createExpression(expression).compile();
				}
			},
			{
				key: "createExpression",
				value: function createExpression(expression) {
					return new Expression(this._grammar, expression);
				}
			},
			{
				key: "getFunction",
				value: function getFunction(name) {
					return this._grammar.functions[name];
				}
			},
			{
				key: "getTransform",
				value: function getTransform(name) {
					return this._grammar.transforms[name];
				}
			},
			{
				key: "eval",
				value: function _eval(expression) {
					var context = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
					return this.createExpression(expression).eval(context);
				}
			},
			{
				key: "evalSync",
				value: function evalSync(expression) {
					var context = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
					return this.createExpression(expression).evalSync(context);
				}
			},
			{
				key: "expr",
				value: function expr(strs) {
					for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) args[_key - 1] = arguments[_key];
					var exprStr = strs.reduce(function(acc, str, idx) {
						var arg = idx < args.length ? args[idx] : "";
						acc += str + arg;
						return acc;
					}, "");
					return this.createExpression(exprStr);
				}
			},
			{
				key: "removeOp",
				value: function removeOp(operator) {
					if (this._grammar.elements[operator] && (this._grammar.elements[operator].type === "binaryOp" || this._grammar.elements[operator].type === "unaryOp")) delete this._grammar.elements[operator];
				}
			},
			{
				key: "_addGrammarElement",
				value: function _addGrammarElement(str, obj) {
					this._grammar.elements[str] = obj;
				}
			}
		]);
		return Jexl;
	}();
	module.exports = new Jexl();
	module.exports.Jexl = Jexl;
})))(), 1);
/** jexl ships a UMD bundle whose `module.exports` is the ready-made instance. */
var jexl = import_Jexl.default?.default ?? import_Jexl.default;
/** Handlebars sub-expressions/blocks — never wrap these in `{{esc}}`. */
var NON_VALUE_MUSTACHE = /^[#/!>^&]|^\s*else\b/;
/**
* Evaluate one Jexl expression.
*
* Jexl is used instead of `eval()` so a template can never reach globals, the
* DOM, or `fetch` — the worst a malicious template can do is compute a wrong
* number.
*/
function evaluateExpression(expression, context) {
	try {
		return jexl.evalSync(expression, context);
	} catch (err) {
		const reason = err instanceof Error ? err.message : String(err);
		throw new Error(`[mono-export] cannot evaluate {{= ${expression} }} — ${reason}`);
	}
}
/**
* Normalise JS habits that Jexl's grammar doesn't share. Everyone types `===`;
* Jexl only knows `==`, and would otherwise throw a bare "Token = unexpected".
*/
function normalizeExpression(expression) {
	return expression.replace(/===/g, "==").replace(/!==/g, "!=");
}
/** Escape a string for embedding in a Handlebars double-quoted literal. */
function toHandlebarsLiteral(value) {
	return `"${value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"")}"`;
}
/**
* Find the `}}` that closes a mustache opened at `start`, ignoring any that
* appear inside a quoted string (`{{= name == "a}}b" }}` is one expression).
* Returns the index of the `}}`, or `-1` when unterminated.
*/
function findMustacheEnd(src, start) {
	let quote = null;
	for (let i = start; i < src.length - 1; i += 1) {
		const ch = src[i];
		if (quote) {
			if (ch === "\\") i += 1;
			else if (ch === quote) quote = null;
			continue;
		}
		if (ch === "\"" || ch === "'") {
			quote = ch;
			continue;
		}
		if (ch === "}" && src[i + 1] === "}") return i;
	}
	return -1;
}
/** Whether `line` is a GFM table row (`| a | b |`), ignoring indentation. */
function isTableRow(line) {
	return /^\s{0,3}\|/.test(line);
}
/**
* Rewrite a template's mustaches. Single pass, line-aware (for table rows) and
* code-aware (fenced blocks + inline spans are copied verbatim).
*/
function preprocessTemplate(src, opts = {}) {
	const escapeCells = opts.escapeTableCells !== false;
	const lines = src.split("\n");
	const state = {
		fence: null,
		inCode: false
	};
	const out = [];
	for (const line of lines) {
		const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
		if (fenceMatch) {
			const marker = fenceMatch[1][0].repeat(3);
			if (state.fence === null) state.fence = marker;
			else if (state.fence === marker) state.fence = null;
			out.push(line);
			continue;
		}
		if (state.fence) {
			out.push(line);
			continue;
		}
		out.push(rewriteLine(line, escapeCells && isTableRow(line), state));
	}
	return out.join("\n");
}
/** Rewrite the mustaches on one non-fenced line. */
function rewriteLine(line, wrapCells, state) {
	let out = "";
	let i = 0;
	while (i < line.length) {
		const ch = line[i];
		if (ch === "`") {
			state.inCode = !state.inCode;
			out += ch;
			i += 1;
			continue;
		}
		if (state.inCode || ch !== "{" || line[i + 1] !== "{") {
			out += ch;
			i += 1;
			continue;
		}
		const isTriple = line[i + 2] === "{";
		const open = isTriple ? i + 3 : i + 2;
		const end = findMustacheEnd(line, open);
		if (end === -1) {
			out += line.slice(i);
			break;
		}
		const closeLength = isTriple && line[end + 2] === "}" ? 3 : 2;
		const inner = line.slice(open, end);
		out += renderMustache(inner, {
			isTriple,
			wrapCells
		});
		i = end + closeLength;
	}
	return out;
}
/**
* Split a mustache body into its Handlebars whitespace-control markers and the
* expression between them, so `{{~ foo ~}}` keeps its `~`s after rewriting.
*/
function splitWhitespaceControl(inner) {
	let body = inner;
	let open = "";
	let close = "";
	if (body.startsWith("~")) {
		open = "~";
		body = body.slice(1);
	}
	if (body.endsWith("~")) {
		close = "~";
		body = body.slice(0, -1);
	}
	return {
		open,
		body: body.trim(),
		close
	};
}
/**
* Whether `body` is a bare path (`Name.Full`, `[my field]`, `@index`) rather
* than a helper call (`currency salary`).
*
* This distinction decides how the value is handed to `esc`: a path is passed
* as an **argument** (`{{esc Name.Full}}`), while a helper call must become a
* **sub-expression** (`{{esc (currency salary)}}`). Getting it backwards breaks
* at runtime — `(Name.Full)` compiles to a helper invocation, and Handlebars
* then tries to *call* the string it resolved.
*/
function isBarePath(body) {
	return (body.startsWith("[") ? body.slice(body.indexOf("]") + 1) : body.replace(/^\S+/, "")).trim() === "";
}
/** Turn one mustache body into its rewritten `{{…}}` form. */
function renderMustache(inner, { isTriple, wrapCells }) {
	const { open, body, close } = splitWhitespaceControl(inner);
	const wrap = (expr) => `{{${open}${expr}${close}}}`;
	if (body.startsWith("=")) {
		const call = `__jexl ${toHandlebarsLiteral(normalizeExpression(body.slice(1).trim()))}`;
		return wrap(wrapCells ? `esc (${call})` : call);
	}
	if (isTriple) return `{{{${inner}}}}`;
	if (NON_VALUE_MUSTACHE.test(body)) return wrap(body);
	if (wrapCells) return wrap(isBarePath(body) ? `esc ${body}` : `esc (${body})`);
	return wrap(body);
}
/**
* Escape an interpolated value for a GFM table cell. Registered as the `esc`
* helper and applied automatically to table-row mustaches by
* {@link preprocessTemplate}; also callable by hand.
*/
function escapeForCell(value) {
	if (value == null) return "";
	return escapeCellText(String(value));
}
//#endregion
//#region src/export/helpers.ts
/**
* Built-in Handlebars helpers for report templates.
*
* Three families:
*
* - **Formatting** (`currency`, `number`, `date`, `percent`) — emit pretty
*   display text *plus* a hidden {@link ValueDirective} carrying the raw value
*   and an Excel number format. That's what keeps `SUM()` working: Markdown
*   shows `Rp 1.000.000`, the spreadsheet stores `1000000`.
* - **Aggregation / logic** (`sum`, `avg`, `count`, `eq`, `gt`, …) — plain
*   values, so they nest as sub-expressions: `{{currency (sum rows "Salary")}}`.
* - **Excel-only** (`style`, `rowStyle`, `merge`, `formula`, `image`) — emit a
*   directive and no visible text, so they vanish from Markdown output.
*/
/** Drop Handlebars' trailing options object, returning it alongside the args. */
function splitArgs(args) {
	const last = args[args.length - 1];
	const isOptions = !!last && typeof last === "object" && "hash" in last;
	return {
		args: isOptions ? args.slice(0, -1) : args,
		hash: (isOptions ? last.hash : void 0) ?? {}
	};
}
/** Coerce to a finite number, or `null` when the value isn't numeric. */
function toNumber(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	if (typeof value === "string" && value.trim() !== "") {
		const n = Number(value);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}
/** Coerce to a Date, or `null`. Accepts a Date, an ISO string, or epoch ms. */
function toDate(value) {
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
	if (typeof value === "number" || typeof value === "string") {
		const d = new Date(value);
		return Number.isNaN(d.getTime()) ? null : d;
	}
	return null;
}
/** Pull `field` off each item (or the item itself when no field is given). */
function pluck(list, field) {
	if (!Array.isArray(list)) return [];
	if (typeof field !== "string" || !field) return list;
	return list.map((item) => item?.[field]);
}
/** The numeric values of `list[field]`, skipping anything non-numeric. */
function numbersOf(list, field) {
	return pluck(list, field).map(toNumber).filter((n) => n !== null);
}
/**
* Derive an Excel number format from a currency code by asking `Intl` where the
* symbol goes and how many decimals it uses — so IDR renders `"Rp"#,##0` and
* EUR-in-German renders `#,##0.00" €"` without a hard-coded lookup table.
*/
function deriveCurrencyFormat(locale, currency) {
	try {
		const parts = new Intl.NumberFormat(locale, {
			style: "currency",
			currency
		}).formatToParts(1);
		const symbol = parts.find((p) => p.type === "currency")?.value ?? currency;
		const fraction = parts.find((p) => p.type === "fraction")?.value ?? "";
		const digits = fraction.length ? `.${"0".repeat(fraction.length)}` : "";
		const symbolFirst = parts.findIndex((p) => p.type === "currency") === 0;
		const quoted = `"${symbol}"`;
		return symbolFirst ? `${quoted}#,##0${digits}` : `#,##0${digits}${quoted}`;
	} catch {
		return "#,##0.00";
	}
}
/**
* Display text + the raw value/format directive that Excel will pick up. The
* display text is echoed back into the directive (`t`) so the renderer can tell
* "this cell *is* the value" from "this value is mentioned mid-sentence".
*/
function formatted(display, directive) {
	return display + encodeDirective({
		k: "val",
		...directive,
		t: display
	});
}
/**
* Build the built-in helper map for one render. Bound to `formatting` so
* locale/currency choices apply consistently across every helper.
*/
function createHelpers(formatting = {}) {
	const locale = formatting.locale;
	const currencyCode = formatting.currency ?? "USD";
	const currencyFormat = formatting.currencyFormat ?? deriveCurrencyFormat(locale, currencyCode);
	const numberFormat = formatting.numberFormat ?? "#,##0";
	const dateFormat = formatting.dateFormat ?? "yyyy-mm-dd";
	const percentFormat = formatting.percentFormat ?? "0.00%";
	return {
		/** `{{currency salary}}` → `$1,234.00` in Markdown, `1234` + format in Excel. */
		currency(...raw) {
			const { args, hash } = splitArgs(raw);
			const n = toNumber(args[0]);
			if (n === null) return "";
			const code = hash.code ?? currencyCode;
			return formatted(new Intl.NumberFormat(locale, {
				style: "currency",
				currency: code
			}).format(n), {
				n,
				f: hash.fmt ?? (code === currencyCode ? currencyFormat : deriveCurrencyFormat(locale, code))
			});
		},
		/** `{{number qty}}` / `{{number rate decimals=2}}`. */
		number(...raw) {
			const { args, hash } = splitArgs(raw);
			const n = toNumber(args[0]);
			if (n === null) return "";
			const decimals = toNumber(hash.decimals);
			return formatted(new Intl.NumberFormat(locale, {
				minimumFractionDigits: decimals ?? void 0,
				maximumFractionDigits: decimals ?? void 0
			}).format(n), {
				n,
				f: hash.fmt ?? (decimals ? `#,##0.${"0".repeat(decimals)}` : numberFormat)
			});
		},
		/** `{{date createdAt}}` — Markdown gets the locale date, Excel a real Date. */
		date(...raw) {
			const { args, hash } = splitArgs(raw);
			const d = toDate(args[0]);
			if (!d) return "";
			return formatted(new Intl.DateTimeFormat(locale, {
				year: "numeric",
				month: "2-digit",
				day: "2-digit"
			}).format(d), {
				d: d.toISOString(),
				f: hash.fmt ?? dateFormat
			});
		},
		/** `{{percent 0.155}}` → `15.50%`; Excel stores the fraction with a % format. */
		percent(...raw) {
			const { args, hash } = splitArgs(raw);
			const n = toNumber(args[0]);
			if (n === null) return "";
			return formatted(new Intl.NumberFormat(locale, {
				style: "percent",
				minimumFractionDigits: 2
			}).format(n), {
				n,
				f: hash.fmt ?? percentFormat
			});
		},
		/** `{{sum employees "salary"}}` — or `{{sum numbers}}` for a bare array. */
		sum: (...raw) => {
			const { args } = splitArgs(raw);
			return numbersOf(args[0], args[1]).reduce((total, n) => total + n, 0);
		},
		avg: (...raw) => {
			const { args } = splitArgs(raw);
			const values = numbersOf(args[0], args[1]);
			return values.length ? values.reduce((t, n) => t + n, 0) / values.length : 0;
		},
		/** `{{count employees}}` — length, or how many have a truthy `field`. */
		count: (...raw) => {
			const { args } = splitArgs(raw);
			const list = args[0];
			if (!Array.isArray(list)) return 0;
			return typeof args[1] === "string" ? pluck(list, args[1]).filter((v) => v != null && v !== "").length : list.length;
		},
		max: (...raw) => {
			const { args } = splitArgs(raw);
			const values = numbersOf(args[0], args[1]);
			return values.length ? Math.max(...values) : 0;
		},
		min: (...raw) => {
			const { args } = splitArgs(raw);
			const values = numbersOf(args[0], args[1]);
			return values.length ? Math.min(...values) : 0;
		},
		eq: (...raw) => {
			const { args } = splitArgs(raw);
			return args[0] === args[1];
		},
		ne: (...raw) => {
			const { args } = splitArgs(raw);
			return args[0] !== args[1];
		},
		gt: (...raw) => compare(raw, (a, b) => a > b),
		gte: (...raw) => compare(raw, (a, b) => a >= b),
		lt: (...raw) => compare(raw, (a, b) => a < b),
		lte: (...raw) => compare(raw, (a, b) => a <= b),
		and: (...raw) => splitArgs(raw).args.every(Boolean),
		or: (...raw) => splitArgs(raw).args.some(Boolean),
		not: (...raw) => !splitArgs(raw).args[0],
		/** `{{default value "-"}}` — fall back when null / undefined / empty. */
		default: (...raw) => {
			const { args } = splitArgs(raw);
			const value = args[0];
			return value == null || value === "" ? args[1] ?? "" : value;
		},
		/**
		* Escape a value for a GFM table cell. Applied automatically to mustaches on
		* table rows by the preprocessor; call it by hand elsewhere if needed.
		*/
		esc: (...raw) => escapeForCell(splitArgs(raw).args[0]),
		/** `{{style "header"}}` — apply a named style to this cell. */
		style: (...raw) => {
			const { args } = splitArgs(raw);
			const name = args[0];
			return typeof name === "string" && name ? encodeDirective({
				k: "style",
				v: name
			}) : "";
		},
		/** `{{rowStyle "groupHeader"}}` — apply a named style to the whole row. */
		rowStyle: (...raw) => {
			const { args } = splitArgs(raw);
			const name = args[0];
			return typeof name === "string" && name ? encodeDirective({
				k: "rowStyle",
				v: name
			}) : "";
		},
		/** `{{merge cols=4}}` — merge this cell across columns and/or rows. */
		merge: (...raw) => {
			const { hash } = splitArgs(raw);
			const cols = toNumber(hash.cols);
			const rows = toNumber(hash.rows);
			if (!cols && !rows) return "";
			return encodeDirective({
				k: "merge",
				...cols ? { cols: Math.max(1, Math.floor(cols)) } : {},
				...rows ? { rows: Math.max(1, Math.floor(rows)) } : {}
			});
		},
		/**
		* `{{formula "SUM(C{row}:D{row})"}}` — an Excel formula for this cell.
		* `{row}`, `{firstRow}`, `{lastRow}` and `{col:Field}` are resolved when the
		* cell is written, since a template can't know its own row number.
		*/
		formula: (...raw) => {
			const { args } = splitArgs(raw);
			const expr = args[0];
			return typeof expr === "string" && expr ? encodeDirective({
				k: "formula",
				v: expr
			}) : "";
		},
		/** `{{image logo width=120 height=40}}` — anchor an image at this cell. */
		image: (...raw) => {
			const { args, hash } = splitArgs(raw);
			const src = args[0];
			if (typeof src !== "string" || !src) return "";
			const width = toNumber(hash.width);
			const height = toNumber(hash.height);
			return encodeDirective({
				k: "image",
				v: src,
				...width ? { width } : {},
				...height ? { height } : {}
			});
		}
	};
}
/** Numeric-aware comparison shared by `gt` / `gte` / `lt` / `lte`. */
function compare(raw, test) {
	const { args } = splitArgs(raw);
	const a = toNumber(args[0]);
	const b = toNumber(args[1]);
	if (a !== null && b !== null) return test(a, b);
	return test(args[0], args[1]);
}
//#endregion
//#region src/export/template.ts
/** Load the optional `handlebars` peer, with an actionable error when it's absent. */
async function loadHandlebars() {
	try {
		const mod = await import("handlebars");
		return mod?.default ?? mod;
	} catch (err) {
		throw new Error("[mono-export] rendering a report needs the optional peer dependency \"handlebars\". Install it in your app: pnpm add handlebars" + (err instanceof Error ? `\n  (resolution failed: ${err.message})` : ""));
	}
}
/**
* Render a report template to Markdown (still carrying directive tokens).
*
* `noEscape` is deliberate: Handlebars' default escaping is *HTML* escaping,
* which would turn `&` into `&amp;` and `"` into `&quot;` inside a spreadsheet
* cell. Table cells are protected instead by the `esc` helper, which the
* preprocessor injects only where it matters (see `expression.ts`).
*/
async function renderTemplate(options) {
	const env = (await loadHandlebars()).create();
	env.registerHelper(createHelpers(options.formatting));
	/**
	* The bridge to Jexl. `this` is the current block context (inside `{{#each}}`
	* it's the item), `options.data.root` is the whole report context — merging
	* them lets an expression name a loop-local field *and* a top-level one.
	*/
	env.registerHelper("__jexl", function(...args) {
		const helperOptions = args[args.length - 1];
		const expression = String(args[0] ?? "");
		const root = helperOptions?.data?.root ?? {};
		const local = typeof this === "object" && this !== null ? this : {};
		const value = evaluateExpression(expression, {
			...root,
			...local,
			this: local
		});
		return value == null ? "" : value;
	});
	if (options.helpers) env.registerHelper(options.helpers);
	if (options.partials) for (const [name, source] of Object.entries(options.partials)) env.registerPartial(name, preprocessTemplate(source));
	return env.compile(preprocessTemplate(options.md ?? ""), { noEscape: true })(options.data ?? {});
}
//#endregion
//#region src/export/index.ts
/**
* `@mono-lit/helper/export` — render a Markdown template into a report.
*
* The pipeline: **Handlebars** fills the template from your data, **Jexl**
* evaluates any `{{= … }}` expressions, **remark** parses the result into an
* AST, and a renderer walks that AST. Markdown is the template language, so the
* layout stays readable and diffable, and the data stays separate from the
* presentation.
*
* @example
* import { exportTable } from '@mono-lit/helper/export'
* import md from './payroll.md?raw'
*
* const report = await exportTable({ md, data: { employees }, fileName: 'payroll.xlsx' })
* report.markdown // the rendered markdown, for a preview pane
*
* Bound to a grid, `monoDataGrid(...).export({ md, … })` does the same thing
* with the table's rows, groups and columns already in the context.
*/
/** Pick the renderer from a file name's extension. */
function formatFromFileName(fileName) {
	if (!fileName) return null;
	const ext = fileName.slice(fileName.lastIndexOf(".") + 1).toLowerCase();
	if (ext === "xlsx" || ext === "xls") return "xlsx";
	if (ext === "md" || ext === "markdown") return "md";
	return null;
}
/** Give a file name the extension its format implies. */
function withExtension(fileName, format) {
	return formatFromFileName(fileName) === format ? fileName : `${fileName}.${format}`;
}
/**
* Render a Markdown report template.
*
* When `fileName` is given its extension selects the renderer and the file
* downloads automatically (pass `download: false` to suppress that). Without
* one, nothing is written — you just get the result object.
*/
async function exportTable(options) {
	const data = await resolveExportData(options.data, { chunkSize: options.chunkSize });
	const rendered = await renderTemplate({
		...options,
		data
	});
	const markdown = stripDirectives(rendered);
	const resolvedFormat = options.format ?? formatFromFileName(options.fileName);
	const detailSheets = [];
	const skipped = [];
	if (options.detail) {
		const detail = options.detail;
		const masterRows = data[detail.from ?? "rows"];
		const { details, skipped: dropped } = await resolveDetails(Array.isArray(masterRows) ? masterRows : [], detail);
		skipped.push(...dropped);
		for (const item of details) detailSheets.push({
			key: item.key,
			name: detail.sheetName?.(item.row) ?? item.key,
			markdown: await renderTemplate({
				...options,
				md: detail.md,
				data: {
					row: item.row,
					rows: item.rows
				}
			})
		});
	}
	let workbookPromise = null;
	const workbook = () => {
		workbookPromise ??= import("./excel-CY6zGkcx.js").then(({ renderExcel }) => renderExcel(parseMarkdown(rendered), {
			...options,
			back: options.detail?.back,
			sheets: detailSheets.map((s) => ({
				key: s.key,
				name: s.name,
				ast: parseMarkdown(s.markdown)
			}))
		})).then(async (book) => {
			await options.onWorkbook?.(book);
			return book;
		});
		return workbookPromise;
	};
	const toBuffer = async (format) => {
		if ((format ?? resolvedFormat ?? "md") === "md") return new TextEncoder().encode(markdown).buffer;
		return await (await workbook()).xlsx.writeBuffer();
	};
	const toBlob = async (format) => {
		const target = format ?? resolvedFormat ?? "md";
		return new Blob([await toBuffer(target)], { type: MIME[target] });
	};
	const download = async (fileName) => {
		const target = resolvedFormat ?? formatFromFileName(fileName) ?? "md";
		const name = withExtension(fileName ?? options.fileName ?? "export", target);
		downloadBlob(await toBlob(target), name);
	};
	const result = {
		markdown,
		format: resolvedFormat,
		fileName: options.fileName ?? null,
		sheets: [options.sheetName ?? "Sheet1", ...detailSheets.map((s) => s.name)],
		skipped,
		toBlob,
		toBuffer,
		workbook,
		download
	};
	if (options.fileName && options.download !== false) await download();
	return result;
}
//#endregion
export { DEFAULT_STYLES, exportTable };

import { t as createNotifier } from "./notifier-CE4yxMUQ.js";
import { t as applyProps } from "./element-props-CLB6yvbm.js";
//#region src/components/modal/mono-modal-controller.ts
/**
* The dialog's `<mono-modal>` defaults. `dialog.props` is merged over these; the
* dismissal locks are re-applied after that merge in `buildDialogElement` and
* cannot be turned off — a dialog is a question, and the only way past it is one
* of its own buttons.
*/
var DIALOG_MODAL_DEFAULTS = {
	size: "xs",
	color: "primary",
	width: "fit-content",
	minWidth: "16rem",
	maxWidth: "min(92vw, 480px)",
	stackable: true,
	draggable: true,
	cssClassName: "mono-modal-dialog"
};
/** Everything a dialog must refuse. Applied last, so `dialog.props` cannot undo it. */
var DIALOG_LOCKS = {
	persistent: true,
	dismissible: false,
	closeOnEscape: false,
	closeOnOverlay: false
};
/** How long a closed dialog's element lingers for the close transition (`--mono-modal-duration` is 0.22s). */
var DIALOG_REMOVE_DELAY = 320;
/** Light tag first; the shadow build registers its own name. */
var resolveTag = (light, shadow) => {
	if (typeof customElements === "undefined") return null;
	if (customElements.get(light)) return light;
	if (customElements.get(shadow)) return shadow;
	return null;
};
function monoModal(options = {}) {
	const notifier = createNotifier();
	const notify = notifier.notify;
	const elementProps = { ...options.props ?? {} };
	const elements = /* @__PURE__ */ new Set();
	let wantOpen = false;
	let isOpen = false;
	const setOpen = (next) => {
		wantOpen = next;
		for (const el of elements) if (next) el.show("manual");
		else el.hide("manual");
		if (!elements.size && isOpen !== next) {
			isOpen = next;
			notify();
		}
	};
	let dialogDefaults = { ...options.dialog ?? {} };
	let dialogEl = null;
	let dialogResolve = null;
	let dialogOpen = false;
	/** Resolve the pending `show()` and start the teardown. */
	const closeDialog = (value) => {
		const el = dialogEl;
		const resolve = dialogResolve;
		dialogEl = null;
		dialogResolve = null;
		dialogOpen = false;
		if (el) {
			el.hide("manual");
			setTimeout(() => el.remove(), DIALOG_REMOVE_DELAY);
		}
		resolve?.(value ?? false);
		notify();
	};
	const buildButton = (tag, item, owner) => {
		const el = document.createElement(tag);
		el.setAttribute("data-mono-dialog-button", "");
		if (item.className) el.className = item.className;
		if (item.icon) {
			const icon = document.createElement("span");
			icon.setAttribute("slot", "icon");
			icon.className = `mono-icon ${item.icon}`;
			el.appendChild(icon);
		}
		if (item.label) el.appendChild(document.createTextNode(item.label));
		const { label: _l, icon: _i, className: _n, onClick, value, ...rest } = item;
		applyProps(el, {
			size: "xs",
			...rest
		});
		el.handler = async (event) => {
			if (onClick) await onClick(event, {
				dialog,
				button: el
			});
			if (value !== void 0 && dialogEl && dialogEl === owner()) closeDialog(value);
		};
		el.addEventListener("mno-click", (e) => e.stopPropagation());
		el.addEventListener("mnoClick", (e) => e.stopPropagation());
		return el;
	};
	const buildDialogElement = (opts, modalTag, buttonTag) => {
		const el = document.createElement(modalTag);
		el.setAttribute("data-mono-dialog", "");
		const body = document.createElement("div");
		body.className = "mono-modal-dialog-body";
		if (opts.body instanceof Node) body.appendChild(opts.body);
		else if (opts.body != null) body.innerHTML = String(opts.body);
		el.appendChild(body);
		const buttons = opts.buttons ?? [];
		if (buttons.length) {
			const foot = document.createElement("span");
			foot.setAttribute("slot", "footer");
			foot.className = "mono-modal-dialog-actions";
			for (const item of buttons) foot.appendChild(buildButton(buttonTag, item, () => el));
			el.appendChild(foot);
		}
		applyProps(el, {
			...DIALOG_MODAL_DEFAULTS,
			...opts.props ?? {},
			...opts.title != null ? { title: opts.title } : {},
			...opts.subtitle != null ? { subtitle: opts.subtitle } : {},
			...DIALOG_LOCKS
		});
		return el;
	};
	const focusButton = async (el, index) => {
		if (index === "none") return;
		const i = typeof index === "number" ? index : 0;
		await el.updateComplete;
		const root = el.renderRoot;
		const target = el.querySelectorAll("[data-mono-dialog-button]")[i] ?? root?.querySelectorAll("[data-mono-dialog-button]")[i];
		if (!target) return;
		await target.updateComplete;
		await new Promise((r) => requestAnimationFrame(() => r(null)));
		if (dialogEl === el) target.focus?.();
	};
	const dialog = {
		show(override) {
			if (typeof document === "undefined") return Promise.reject(/* @__PURE__ */ new Error("[mono-modal] dialog.show() needs a document — call it on the client"));
			const modalTag = resolveTag("mono-modal", "mono-shadow-modal");
			const buttonTag = resolveTag("mono-button", "mono-shadow-button");
			if (!modalTag || !buttonTag) return Promise.reject(/* @__PURE__ */ new Error("[mono-modal] dialog.show(): <mono-modal> and <mono-button> are not registered — import '@mono-lit/helper/ui/modal' (it registers both) before showing a dialog."));
			if (dialogOpen) closeDialog(false);
			const opts = {
				...dialogDefaults,
				...override ?? {},
				props: {
					...dialogDefaults.props ?? {},
					...override?.props ?? {}
				}
			};
			const el = buildDialogElement(opts, modalTag, buttonTag);
			dialogEl = el;
			dialogOpen = true;
			const promise = new Promise((resolve) => {
				dialogResolve = resolve;
			});
			document.body.appendChild(el);
			el.show("manual");
			focusButton(el, opts.focus);
			notify();
			return promise;
		},
		close(value) {
			if (!dialogOpen) return;
			closeDialog(value);
		},
		get isOpen() {
			return dialogOpen;
		},
		get element() {
			return dialogEl;
		},
		setProps(patch) {
			dialogDefaults = {
				...dialogDefaults,
				...patch,
				props: {
					...dialogDefaults.props ?? {},
					...patch.props ?? {}
				}
			};
		}
	};
	return {
		props: () => elementProps,
		setProps(patch) {
			Object.assign(elementProps, patch);
			notify();
		},
		open: () => setOpen(true),
		close: () => setOpen(false),
		toggle: () => setOpen(!isOpen),
		get isOpen() {
			return isOpen;
		},
		get element() {
			return elements.values().next().value ?? null;
		},
		dialog,
		subscribe: notifier.subscribe,
		dispose() {
			if (dialogOpen) closeDialog(false);
			notifier.clear();
			elements.clear();
		},
		_register(el) {
			elements.add(el);
			if (wantOpen && !el.modelValue) el.show("manual");
			else if (isOpen !== el.modelValue) {
				isOpen = el.modelValue;
				notify();
			}
		},
		_unregister(el) {
			elements.delete(el);
		},
		_report(open, _source) {
			wantOpen = open;
			if (isOpen === open) return;
			isOpen = open;
			notify();
		}
	};
}
//#endregion
export { monoModal as t };

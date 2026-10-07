import { MonoEventProps } from '../../composables/element-props.js';
import { InputEvents, InputProps } from '../input/input-types.js';
import { SelectEvents, SelectProps } from '../select/select-types.js';
import { TextareaEvents, TextareaProps } from '../textarea/textarea-types.js';
import { RichTextEditorEvents, RichTextEditorProps } from '../rich-text-editor/rich-text-editor-types.js';
import { DateEvents, DateProps } from '../date/date-types.js';
import { TagInputEvents, TagInputProps } from '../tag-input/tag-input-types.js';
import { FileUploadEvents, FileUploadProps } from '../file-upload/file-upload-types.js';
import { DropdownTableEvents, DropdownTableProps } from '../dropdown-table/dropdown-table-types.js';
import { CheckboxEvents, CheckboxProps } from '../checkbox/checkbox-types.js';
import { RadioEvents, RadioProps } from '../radio/radio-types.js';
import { SwitchEvents, SwitchProps } from '../switch/switch-types.js';
/**
 * Tag name → its props, so `inputs[key].props` and `setProp()` autocomplete against the
 * component actually being driven. Keyed by the LIGHT tag; the shadow twins
 * (`mono-shadow-*`) share the same prop surface and are accepted at runtime.
 *
 * Each entry also takes the component's events as `on<Event>` keys —
 * `onChange`, `onInput`, `onFocus`, … — which the form attaches to the element
 * as listeners rather than writing them as props.
 */
export interface MonoFormComponentProps {
    'mono-input': Partial<InputProps> & MonoEventProps<InputEvents>;
    'mono-select': Partial<SelectProps> & MonoEventProps<SelectEvents>;
    'mono-textarea': Partial<TextareaProps> & MonoEventProps<TextareaEvents>;
    'mono-rich-text-editor': Partial<RichTextEditorProps> & MonoEventProps<RichTextEditorEvents>;
    'mono-date': Partial<DateProps> & MonoEventProps<DateEvents>;
    'mono-tag-input': Partial<TagInputProps> & MonoEventProps<TagInputEvents>;
    'mono-file-upload': Partial<FileUploadProps> & MonoEventProps<FileUploadEvents>;
    'mono-dropdown-table': Partial<DropdownTableProps> & MonoEventProps<DropdownTableEvents>;
    'mono-checkbox': Partial<CheckboxProps> & MonoEventProps<CheckboxEvents>;
    'mono-radio': Partial<RadioProps> & MonoEventProps<RadioEvents>;
    'mono-switch': Partial<SwitchProps> & MonoEventProps<SwitchEvents>;
}
/** Every component `monoForm` can drive. */
export type MonoFormComponent = keyof MonoFormComponentProps;
/** Props for one component, plus any escape-hatch key the element also accepts. */
export type MonoFormProps<C extends MonoFormComponent = MonoFormComponent> = MonoFormComponentProps[C] & Record<string, unknown>;
/**
 * When a rule runs.
 * - `live` — on `input`, i.e. every keystroke.
 * - `change` — on `change`, i.e. commit / blur / select.
 *
 * `form.validate()` runs every rule regardless of timing.
 */
export type MonoFormTiming = 'live' | 'change';
/** Context handed to a `type: 'custom'` rule. */
export interface MonoFormRuleCtx<V = unknown> {
    value: V;
    values: Record<string, unknown>;
    key: string;
}
/**
 * Anything schema-shaped — yup and friends. Duck-typed on purpose: @mono-lit/helper
 * takes no validation dependency, so any object exposing `validateSync` (or an
 * async `validate`) works, and the thrown error's `message` becomes the message.
 */
export interface MonoFormSchemaLike {
    validateSync?: (value: unknown, options?: unknown) => unknown;
    validate?: (value: unknown, options?: unknown) => unknown;
}
interface MonoFormRuleBase {
    /** Overrides the form-level `validation.type` for this rule only. */
    timing?: MonoFormTiming;
    message?: string;
    /**
     * A schema for this rule. When present it WINS over `type`/`validate`, and its
     * own error message wins over `message`.
     */
    schema?: MonoFormSchemaLike;
}
export type MonoFormRule<V = unknown> = (MonoFormRuleBase & {
    type: 'required';
}) | (MonoFormRuleBase & {
    type: 'min';
    value: number;
}) | (MonoFormRuleBase & {
    type: 'max';
    value: number;
}) | (MonoFormRuleBase & {
    type: 'pattern';
    value: RegExp | string;
}) | (MonoFormRuleBase & {
    type: 'email';
}) | (MonoFormRuleBase & {
    type: 'custom';
    /** Return `true` to pass, or a string / `false` to fail. */
    validate: (ctx: MonoFormRuleCtx<V>) => boolean | string;
})
/** Schema-only rule — no `type` needed. */
 | (MonoFormRuleBase & {
    type?: undefined;
    schema: MonoFormSchemaLike;
});
/** The validation record exposed per field. */
export interface MonoFormValidation {
    /** `true` when the field passes. */
    success: boolean;
    /** The failure message, or `''` when it passes. */
    message: string;
}
/**
 * One row of a list control's RESOLVED options, as reported onto {@link MonoFormItem.list}.
 *
 * A flat sequence — group headers interleaved with their leaves, in display order — so it is
 * rendered with ONE loop that branches on `type`. It is the shape `mono-tag-input`'s own
 * `_groupRows()` already produces internally.
 *
 * ⚠ The discriminant is `type` here, while `controlMonoTable`'s `displayRows` spells the same idea
 * `kind`. The two are deliberately not unified — do not "tidy" either to match the other.
 */
export interface MonoFormListEntry<T = Record<string, unknown>> {
    /** `'row'` for a selectable option, `'group'` for the header above a run of them. */
    type: 'row' | 'group';
    /**
     * A row's key is `item[keyValue]` — the same value `key-value` already resolves for selection, so
     * there is only ever one notion of a key here. A group's key is its own group path.
     */
    key: string;
    /** The source row. Present on `'row'` entries only. */
    item?: T;
    /** The group's resolved caption. Present on `'group'` entries only. */
    label?: string;
    /** Nesting depth. On a ROW this is the depth of the group it sits IN, so indent by it directly. */
    level: number;
    /** A group's leaves — enough for a count without walking the rest of the list. */
    items?: T[];
    /** Whether this row is currently picked. `'row'` only. */
    selected?: boolean;
    /** Whether the keyboard cursor is on this row. `'row'` only. */
    active?: boolean;
}
/** One field's live state, as read through `form.items()`. */
export interface MonoFormItem<V = unknown> {
    /** The field name — the same string used as `key-form` on the control. */
    key: string;
    /** The value right now. */
    currentValue: V;
    /** The value before the most recent change. */
    oldValue: V;
    /** Current verdict — from the field's rules, or from `setValidation`. */
    validate: MonoFormValidation;
    /** Whether the field has been committed at least once (drives nothing yet; useful to consumers). */
    touched: boolean;
    /** The merged props currently pushed onto the element. */
    props: Record<string, unknown>;
    /**
     * The control's RESOLVED options — after the search box, after the DataSource loaded, after
     * grouping was flattened. Empty for a control that has no list.
     *
     * This is what `slot="list"` is looped over: the raw `items` / `dataSource` you passed in would
     * ignore the search box and desync from what is on screen, which is the whole reason the control
     * reports this back up rather than the consumer reusing its own array.
     */
    list: MonoFormListEntry[];
}
/** A ref-like external input (a Vue `ref` satisfies this). */
export interface MonoFormRefLike<T = unknown> {
    value: T;
}
/** Argument to `setProp` — `component` narrows `props`. */
export type MonoFormSetProp<C extends MonoFormComponent = MonoFormComponent> = {
    component?: C;
    key: string;
    props: MonoFormProps<C>;
};
/** Argument to `setValidation`. */
export interface MonoFormSetValidation {
    component?: MonoFormComponent;
    key: string;
    validation: Partial<MonoFormValidation>;
}
/** Context handed to a field watcher. */
export interface MonoFormWatcherCtx {
    /** The field this watcher belongs to. */
    selfKey: string;
    /** The field that actually changed (equals `selfKey` for a self change). */
    peerKey: string;
    /** Value of `selfKey`. */
    currentValue: unknown;
    oldValue: unknown;
    /** Value of `peerKey` — the field that changed. */
    peerCurrentValue: unknown;
    peerOldValue: unknown;
    /**
     * The DOM `CustomEvent` (`mno-input` / `mno-change` — same payload as the plain
     * `input` / `change`) that last touched
     * `selfKey`. `undefined` when this field hasn't been edited by hand yet, or
     * when its value was written programmatically via `setValue` / `setValues`.
     */
    event?: Event;
    /**
     * The DOM `CustomEvent` that caused THIS run — the one that changed `peerKey`.
     * Same object as `event` on a self change. `undefined` for a programmatic write.
     */
    peerEvent?: Event;
    /** Every field's current value. */
    values: Record<string, unknown>;
    /** Unwrapped `external` refs. */
    external: Record<string, unknown>;
    /**
     * Push props onto any field's control. NOTE: a static `inputs[key].props`
     * declares the same thing and ALWAYS wins over this one.
     */
    setProp: <C extends MonoFormComponent = MonoFormComponent>(arg: MonoFormSetProp<C>) => void;
    /** Mark any field valid/invalid — the message renders on that control. */
    setValidation: (arg: MonoFormSetValidation) => void;
    /** Set another field's value (runs its rules + fans out again). */
    setValue: (key: string, value: unknown) => void;
}
/**
 * One field's declaration, for ONE component. Consumers use {@link MonoFormInput},
 * which distributes this over the components it is given.
 */
export interface MonoFormInputOf<C extends MonoFormComponent = MonoFormComponent, V = unknown> {
    /** Narrows the TS type of `props`. Optional — omit for a loose record. */
    component?: C;
    /**
     * Static props for this field's control that ALWAYS win — over the
     * `setProp()` method and over template bindings. Same name and role as
     * `monoDataGrid({ props })`.
     */
    props?: MonoFormProps<C>;
    /** Initial value for the field. */
    value?: V;
    /**
     * Rules for this field, checked in order — the FIRST failure is reported,
     * since a control renders one message. Each entry is a built-in `type`, a
     * `type: 'custom'` function, or a `schema` (which wins over both).
     */
    validates?: MonoFormRule<V>[];
    /**
     * Runs when THIS field changes (`peerKey === selfKey`) and whenever any OTHER
     * field changes (`peerKey` = that field) — which is what lets one field react
     * to another without a separate peer-watcher registry.
     */
    watcher?: (ctx: MonoFormWatcherCtx) => void;
}
/**
 * One field's declaration — {@link MonoFormInputOf} DISTRIBUTED over `C`, so
 * `component: 'mono-input'` discriminates the declaration and `props` narrows to
 * that component's props, with its `on<Event>` handlers typed
 * (`onChange: (e) => e.detail.modelValue`). Written as one interface over the
 * union, `props` was the union of every component's props and a handler's
 * `event` fell back to `any`. A declaration without `component` still matches
 * (every member's `component` is optional) and keeps the loose union.
 */
export type MonoFormInput<C extends MonoFormComponent = MonoFormComponent, V = unknown> = {
    [K in C]: MonoFormInputOf<K, V>;
}[C];
export interface MonoFormOptions {
    /** Default rule timing for the whole form. Defaults to `'change'`. */
    validation?: {
        type?: MonoFormTiming;
    };
    inputs: Record<string, MonoFormInput>;
    /** Ref-like values readable from watchers as `external.<name>`. */
    external?: Record<string, MonoFormRefLike | unknown>;
    /**
     * A ref the form writes a fresh snapshot into on every change, so a Vue
     * template can read `state.Name.validate.message` and re-render without any
     * manual subscription.
     */
    state?: MonoFormRefLike<Record<string, MonoFormItem> | undefined>;
}
/** The controller returned by {@link monoForm}. */
export interface MonoFormController {
    /** Live state for every field (stable object, mutated in place). */
    items(): Record<string, MonoFormItem>;
    /** Just the values, `{ Name: 'Denis', Age: 18 }`. */
    values(): Record<string, unknown>;
    setValue(key: string, value: unknown): void;
    /** Bulk-set values, e.g. seeding an edit form from a fetched record. */
    setValues(values: Record<string, unknown>): void;
    /** Run EVERY rule on every field regardless of timing. Resolves to overall validity. */
    validate(): Promise<boolean>;
    /** Whether every field currently passes. */
    isValid(): boolean;
    /** Clear values + validation back to the declared defaults. */
    reset(): void;
    /** Push props onto a field's control. `inputs[key].props` still wins over this. */
    setProp<C extends MonoFormComponent = MonoFormComponent>(arg: MonoFormSetProp<C>): void;
    /** Mark any field valid/invalid, e.g. from a server response. */
    setValidation(arg: MonoFormSetValidation): void;
    /** Re-read `external` refs and re-run watchers. */
    refresh(): void;
    /** Write snapshots into `ref` on every change (same as the `state` option). */
    bindRef(ref: MonoFormRefLike<Record<string, MonoFormItem> | undefined>): () => void;
    subscribe(cb: () => void): () => void;
    dispose(): void;
    /** @internal Register an element under `key`; returns an unregister handle. */
    _register(key: string, el: unknown): () => void;
    /**
     * @internal Element reported a value change. `timing` picks which rules run;
     * `event` is the originating `mno-input`/`mno-change` CustomEvent, surfaced to
     * watchers as `event` / `peerEvent`.
     */
    _report(key: string, value: unknown, timing: MonoFormTiming, event?: Event): void;
    /**
     * @internal A list control publishing its resolved options, so `form.items()[key].list` can be
     * looped from a `slot="list"`. Reference-compared, so a control may call it on every render.
     */
    _reportList(key: string, entries: MonoFormListEntry[]): void;
    /** @internal The props an element should currently apply (`inputs[key].props` wins). */
    _propsFor(key: string): Record<string, unknown>;
}
export {};

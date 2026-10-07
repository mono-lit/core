type ElementClass = CustomElementConstructor;
/** Register `cls` as `tag` with the app-wide defaults applied. Returns the registered class. */
export declare function defineMonoElement<T extends ElementClass>(tag: string, cls: T): T;
/**
 * Drop-in for Lit's `@customElement(tag)`: registers the class (wrapped so
 * `createMonoUI` defaults apply and `pending` exists) and replaces the class binding with it.
 */
export declare function customElement(tag: string): <T extends ElementClass>(cls: T) => T;
export {};

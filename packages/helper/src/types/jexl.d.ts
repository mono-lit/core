/**
 * `jexl` ships a UMD bundle with no type declarations. Only the surface the
 * report engine uses is declared here — `evalSync`, plus the extension points a
 * consumer might reach for through the same instance.
 */
declare module 'jexl' {
  export interface JexlInstance {
    /** Evaluate an expression against a context, synchronously. */
    evalSync(expression: string, context?: unknown): unknown
    /** Evaluate an expression against a context. */
    eval(expression: string, context?: unknown): Promise<unknown>
    /** Register a `|transform` usable inside expressions. */
    addTransform(name: string, fn: (...args: any[]) => unknown): void
    /** Register a custom binary operator. */
    addBinaryOp(operator: string, precedence: number, fn: (a: any, b: any) => unknown): void
    /** Register a custom unary operator. */
    addUnaryOp(operator: string, fn: (a: any) => unknown): void
  }

  const jexl: JexlInstance
  export default jexl
}

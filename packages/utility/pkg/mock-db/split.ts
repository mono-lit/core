// pkg/mock-db/split.ts — depth-aware splitting, shared by $apply and $expand.
//
// Both need to split a list on a separator WITHOUT cutting inside parentheses or
// quotes. Splitting `$expand` naively on `,` is what broke
// `PostBudget($select=Id,Nama),Brand($select=Nama)` — the comma inside the parens
// tore the item in half.
//
// Pure, dependency-free, imported by both apply.ts and odata.ts (neither imports
// the other, so there is no cycle).

/**
 * Split `input` on `separator`, but only at nesting depth 0 and outside quotes.
 *
 * @example
 * splitTopLevel("A($select=x,y),B", ',')  ->  ["A($select=x,y)", "B"]
 */
export function splitTopLevel(input: string, separator = ','): string[] {
    const parts: string[] = []
    let depth = 0
    let current = ''
    let quote: string | null = null

    for (const char of String(input ?? '')) {
        if (quote) {
            current += char
            if (char === quote) quote = null
            continue
        }
        if (char === "'" || char === '"') {
            quote = char
            current += char
            continue
        }
        if (char === '(') depth++
        if (char === ')') depth--

        if (char === separator && depth === 0) {
            parts.push(current.trim())
            current = ''
            continue
        }
        current += char
    }

    if (current.trim()) parts.push(current.trim())
    return parts
}

/** The body between the outermost parens of `name(...)`, or null if it isn't one. */
export function readCall(segment: string, name: string): string | null {
    const trimmed = segment.trim()
    if (!trimmed.toLowerCase().startsWith(`${name.toLowerCase()}(`)) return null
    if (!trimmed.endsWith(')')) throw new Error(`unbalanced parentheses in "${segment}"`)
    return trimmed.slice(name.length + 1, -1)
}

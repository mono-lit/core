import { Root, RootContent, PhrasingContent } from 'mdast';
import { MonoExportDirective } from './sentinel';
export type { Root, RootContent };
/**
 * Parse rendered Markdown into an mdast tree, with GFM tables enabled.
 *
 * ── Why the table body does not go through remark ────────────────────────────
 *
 * remark-gfm's table parsing degrades super-linearly on the tables a REPORT
 * produces. Measured on a 13-column export: 500 rows took 3.8s, 1 000 took 13.5s
 * and 2 000 took 86s — doubling the rows more than quadrupled the time, and a
 * 7 000-row export never finished at all. It is the whole of the export's cost;
 * ExcelJS serialises the same workbook in ~200ms.
 *
 * The markdown a template produces is not arbitrary CommonMark, though: it is
 * machine-generated and line-regular, one row per line, and the report helpers
 * already escape any `|` inside a value (see `escapeCellText`). So table blocks
 * are read line-by-line here — linear, and no micromark involved — while every
 * other construct (headings, paragraphs, lists) is still handed to remark, which
 * is both correct and cheap because those parts are tiny.
 *
 * Inline fidelity is kept per cell: a cell containing markdown syntax
 * (`**bold**`, `[text](url)`, an image) is still parsed by remark, so links and
 * emphasis behave exactly as before. Only plain cells take the fast path.
 */
export declare function parseMarkdown(md: string): Root;
/** Inline formatting collected while flattening a run of phrasing content. */
export interface InlineText {
    text: string;
    bold: boolean;
    italic: boolean;
    code: boolean;
    strike: boolean;
    /** Directives found anywhere in the run. */
    directives: MonoExportDirective[];
    /** Images found in the run (from `![alt](src)` — `{{image}}` is a directive). */
    images: Array<{
        url: string;
        alt?: string;
    }>;
    /** The first link URL in the run, if any. */
    link?: string;
}
/**
 * Flatten phrasing content (the inline children of a cell, heading, paragraph
 * or list item) into one string plus the formatting that applies to it.
 *
 * Excel styles a cell as a whole rather than per character run, so mixed
 * emphasis collapses to "was there any bold/italic in here" — matching what a
 * report author actually expects from `| **Total** | 123 |`.
 */
export declare function flattenInline(nodes: readonly PhrasingContent[] | undefined): InlineText;

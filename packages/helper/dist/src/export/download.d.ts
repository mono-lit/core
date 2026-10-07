/**
 * Browser download helper. Kept separate (and DOM-guarded) so the report engine
 * can still render on a server — where `download()` is simply a no-op warning
 * rather than a crash.
 */
/** MIME type per output format. */
export declare const MIME: Record<string, string>;
/** Save a Blob to disk via a transient `<a download>`. Browser only. */
export declare function downloadBlob(blob: Blob, fileName: string): void;

/**
 * Sanitizes text extracted from an uploaded document before it's ever
 * stored or displayed (spec: "Sanitize extracted document content").
 * Strips control characters a malformed/malicious PDF/DOCX could smuggle
 * in (keeping newline/tab), collapses runs of blank lines, and caps length
 * so one huge file can't blow up storage or downstream AI-context usage
 * in later phases.
 */
const MAX_EXTRACTED_TEXT_LENGTH = 200_000;

// Intentionally matching raw control bytes (except \n \t) to strip them.
const CONTROL_CHARS_EXCEPT_NEWLINE_TAB = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

export function sanitizeExtractedText(raw: string): string {
  const stripped = raw
    .replace(CONTROL_CHARS_EXCEPT_NEWLINE_TAB, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

  return stripped.length > MAX_EXTRACTED_TEXT_LENGTH
    ? stripped.slice(0, MAX_EXTRACTED_TEXT_LENGTH)
    : stripped;
}

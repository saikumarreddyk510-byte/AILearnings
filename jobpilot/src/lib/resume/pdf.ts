import "server-only";
import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extracts plain text from a PDF buffer. unpdf wraps pdfjs-dist with a
 * Node-friendly entry point — no browser Worker/DOMMatrix shims required,
 * unlike using pdfjs-dist directly.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

import "server-only";
import { extractRawText } from "mammoth";

/**
 * Extracts plain text from a DOCX buffer via mammoth. Node-only (reads
 * zip/XML via Node buffers) — must never run in an Edge runtime.
 */
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await extractRawText({ buffer });
  return value;
}

import "server-only";
import JSZip from "jszip";

export type SniffedFileKind = "pdf" | "docx" | "unknown";

const PDF_MAGIC = Buffer.from("%PDF-", "ascii");
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // "PK\x03\x04"

/**
 * Identifies a file's real kind from its bytes, never from a client-
 * supplied Content-Type/extension. A DOCX is a ZIP, so a ZIP signature
 * alone isn't proof of a DOCX — we additionally open the archive and look
 * for `word/document.xml`, which is specific to OOXML wordprocessing
 * documents (closes the "rename a .zip/.xlsx to .docx" spoof cheaply,
 * without a full XML parse).
 */
export async function sniffFileKind(buffer: Buffer): Promise<SniffedFileKind> {
  if (buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    return "pdf";
  }

  if (buffer.subarray(0, ZIP_MAGIC.length).equals(ZIP_MAGIC)) {
    try {
      const zip = await JSZip.loadAsync(buffer);
      if (zip.file("word/document.xml")) {
        return "docx";
      }
    } catch {
      // Not a valid zip after all — fall through to "unknown".
    }
  }

  return "unknown";
}

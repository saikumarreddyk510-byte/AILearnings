import "server-only";
import { Document, Packer, Paragraph } from "docx";

/** Renders approved cover-letter text into a plain DOCX, one paragraph per blank-line-separated block. */
export async function buildCoverLetterDocx(text: string): Promise<Buffer> {
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const paragraphs = (blocks.length > 0 ? blocks : [text]).map((block) => new Paragraph(block));

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  return Packer.toBuffer(doc);
}

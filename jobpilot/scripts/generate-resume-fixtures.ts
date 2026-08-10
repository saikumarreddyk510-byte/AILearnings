/**
 * One-time generator for test fixtures under tests/fixtures/resumes/.
 * There's no way to "download a sample résumé" for a test suite, so this
 * builds tiny, known-content PDF/DOCX files programmatically. Run manually
 * whenever the fixtures need to change:
 *
 *   npx tsx scripts/generate-resume-fixtures.ts
 *
 * The generated files are committed to the repo — this script is a
 * devDependency-only tool, never imported by application code.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { Document, Packer, Paragraph } from "docx";
import { FIXTURE_MARKER } from "../tests/fixtures/resume-fixture-marker";

const OUT_DIR = join(process.cwd(), "tests", "fixtures", "resumes");

async function generatePdf() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 300]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText(FIXTURE_MARKER, { x: 20, y: 260, size: 12, font });
  page.drawText("Phone: (555) 123-4567", { x: 20, y: 240, size: 12, font });
  const bytes = await doc.save();
  writeFileSync(join(OUT_DIR, "sample.pdf"), bytes);
  console.log("Wrote sample.pdf");
}

async function generateDocx() {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph(FIXTURE_MARKER),
          new Paragraph("Phone: (555) 123-4567"),
        ],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  writeFileSync(join(OUT_DIR, "sample.docx"), buffer);
  console.log("Wrote sample.docx");
}

function generateInvalid() {
  writeFileSync(
    join(OUT_DIR, "invalid-not-a-resume.txt"),
    "This is a plain text file, not a real résumé document.\n"
  );
  console.log("Wrote invalid-not-a-resume.txt");
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  await generatePdf();
  await generateDocx();
  generateInvalid();
}

// Only run when executed directly (`npx tsx scripts/generate-resume-fixtures.ts`)
// — this module is also imported by tests purely for FIXTURE_MARKER, and
// that import must never re-trigger fixture generation as a side effect.
const isMainModule =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

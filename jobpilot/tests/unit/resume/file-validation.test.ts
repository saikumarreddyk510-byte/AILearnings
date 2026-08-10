import { readFileSync } from "node:fs";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { validateResumeUpload } from "@/lib/resume/validate-upload";
import { RESUME_MAX_UPLOAD_BYTES } from "@/lib/resume/constants";

const PDF_BYTES = readFileSync("tests/fixtures/resumes/sample.pdf");
const DOCX_BYTES = readFileSync("tests/fixtures/resumes/sample.docx");

describe("validateResumeUpload", () => {
  it("accepts a real PDF declared as application/pdf", async () => {
    const file = new File([PDF_BYTES], "resume.pdf", { type: "application/pdf" });
    const result = await validateResumeUpload(file);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mimeType).toBe("application/pdf");
  });

  it("accepts a real DOCX declared with the OOXML mime type", async () => {
    const file = new File([DOCX_BYTES], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const result = await validateResumeUpload(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.mimeType).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
    }
  });

  it("rejects a plain-text file spoofed as application/pdf", async () => {
    const file = new File(["not actually a pdf"], "resume.pdf", {
      type: "application/pdf",
    });
    const result = await validateResumeUpload(file);
    expect(result.ok).toBe(false);
  });

  it("rejects a plain zip (not an OOXML document) renamed to .docx", async () => {
    const zip = new JSZip();
    zip.file("not-word/whatever.xml", "<xml/>");
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const file = new File([Uint8Array.from(zipBuffer)], "resume.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const result = await validateResumeUpload(file);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty file", async () => {
    const file = new File([], "resume.pdf", { type: "application/pdf" });
    const result = await validateResumeUpload(file);
    expect(result.ok).toBe(false);
  });

  it("rejects a file over the size limit", async () => {
    const oversized = new Uint8Array(RESUME_MAX_UPLOAD_BYTES + 1);
    const file = new File([oversized], "resume.pdf", { type: "application/pdf" });
    const result = await validateResumeUpload(file);
    expect(result.ok).toBe(false);
  });

  it("rejects a disallowed declared MIME type", async () => {
    const file = new File([PDF_BYTES], "resume.png", { type: "image/png" });
    const result = await validateResumeUpload(file);
    expect(result.ok).toBe(false);
  });
});

# ---------------- Architecture Diagram ----------------
# [User Uploads File (Streamlit UI)]
#        |
#        v
# [read_uploaded_file(uploaded_file)]
#        |
#        |----> .txt  --> decode UTF-8 --> return plain text
#        |
#        |----> .pdf  --> save to tempfile
#        |              --> PdfReader(tmp_path)
#        |              --> extract_text() per page
#        |              --> join all pages --> return text
#        |
#        |----> .docx --> save to tempfile
#                       --> docx2txt.process(tmp_path)
#                       --> return text
#        v
# [Plain Text String returned to app.py]
#
# ---------------- Deep Architecture Notes ----------------
# file_utils.py lo oka responsibility undi: uploaded file ni plain text ga convert cheyyadam.
# Streamlit lo user file upload chesthe, aa file object ikkade process avutundi.
# .txt files direct ga decode avutayi — simple ga bytes to string.
# .pdf files ki PdfReader use chestamu — every page text extract chesukuntam.
# .docx files ki docx2txt use chestamu — Word document lo content teestundi.
# Anni cases lo output oka plain string — adi app.py ki return avutundi.
# Unsupported file type ayithe ValueError raise chestundi — boundary check.

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Optional

from pypdf import PdfReader
import docx2txt


def read_uploaded_file(uploaded_file) -> str:
    """Read txt, pdf, or docx uploaded from Streamlit."""
    if uploaded_file is None:
        return ""

    suffix = Path(uploaded_file.name).suffix.lower()

    if suffix == ".txt":
        return uploaded_file.read().decode("utf-8", errors="ignore")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(uploaded_file.getvalue())
        tmp_path = tmp.name

    if suffix == ".pdf":
        reader = PdfReader(tmp_path)
        text = []
        for page in reader.pages:
            text.append(page.extract_text() or "")
        return "\n".join(text)

    if suffix == ".docx":
        return docx2txt.process(tmp_path)

    raise ValueError("Unsupported file type. Please upload .txt, .pdf, or .docx")

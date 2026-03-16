"""
PDF Parser Module
Extracts clean, structured text from uploaded pitch deck PDFs.
Uses pypdf for robust multi-page extraction with error handling.
"""

import io
import logging
from pypdf import PdfReader

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract all text from a PDF given its raw bytes.

    Args:
        file_bytes: Raw bytes of the uploaded PDF file.

    Returns:
        A single string containing text from all pages, separated by
        page markers so the AI can understand document structure.

    Raises:
        ValueError: If the PDF is empty, encrypted, or unreadable.
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))

        if reader.is_encrypted:
            raise ValueError("PDF is password-protected. Please upload an unlocked PDF.")

        if len(reader.pages) == 0:
            raise ValueError("PDF contains no pages.")

        pages_text: list[str] = []
        for page_num, page in enumerate(reader.pages, start=1):
            raw = page.extract_text() or ""
            cleaned = _clean_text(raw)
            if cleaned:
                pages_text.append(f"[PAGE {page_num}]\n{cleaned}")

        if not pages_text:
            raise ValueError("No readable text found in PDF. It may be image-only.")

        full_text = "\n\n".join(pages_text)
        logger.info(f"Extracted {len(pages_text)} pages, {len(full_text)} characters.")
        return full_text

    except ValueError:
        raise
    except Exception as e:
        logger.error(f"PDF extraction failed: {e}")
        raise ValueError(f"Failed to parse PDF: {str(e)}")


def _clean_text(text: str) -> str:
    """
    Normalize whitespace and remove junk characters common in PDF extraction.

    - Collapses multiple blank lines into one
    - Strips leading/trailing whitespace per line
    """
    lines = text.splitlines()
    cleaned_lines = [line.strip() for line in lines]
    # Collapse consecutive blank lines
    result, prev_blank = [], False
    for line in cleaned_lines:
        is_blank = line == ""
        if is_blank and prev_blank:
            continue
        result.append(line)
        prev_blank = is_blank
    return "\n".join(result).strip()

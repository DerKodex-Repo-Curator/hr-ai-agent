import fitz  # PyMuPDF

def parse_resume_to_text(pdf_content: bytes):
    try:
        doc = fitz.open(stream=pdf_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception as e:
        print(f"Parsing Error: {e}")
        return ""
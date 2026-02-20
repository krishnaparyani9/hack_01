import modal

app = modal.App("gemma3-summarizer")

# -------------------------------
# 1️⃣ Define container image
# -------------------------------
image = (
    modal.Image.debian_slim()
    .pip_install(
        "torch>=2.4.0",
        "transformers>=4.51.3",
        "fastapi",
        "python-multipart",
        "pillow",
        "pdfplumber"
    )
)

# -------------------------------
# 2️⃣ Create FastAPI ASGI App
# -------------------------------
@app.function(
    image=image,
    gpu="A100",
    timeout=600,
    secrets=[modal.Secret.from_name("huggingface-secret")]
)
@modal.asgi_app()
def fastapi():

    import os
    import io
    from typing import Optional
    from fastapi import FastAPI, UploadFile, File, Form
    from PIL import Image
    import pdfplumber
    from transformers import pipeline

    # 🔥 Load model ONCE per container
    model = pipeline(
        "image-text-to-text",
        model="google/gemma-3-4b-it",
        device=0,
        token=os.environ["HF_TOKEN"]
    )

    api = FastAPI()

    @api.post("/summarize")
    async def summarize(
        text: str = Form(...),
        image: Optional[UploadFile] = File(None),
        pdf: Optional[UploadFile] = File(None),
    ):
        img_obj = None

        if image:
            img_bytes = await image.read()
            img_obj = Image.open(io.BytesIO(img_bytes))

        pdf_text = ""
        if pdf:
            pdf_bytes = await pdf.read()
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf_file:
                for page in pdf_file.pages:
                    pdf_text += page.extract_text() or ""

        full_prompt = f"""
You are a medical AI assistant.

Extract and summarize the following report.

Return ONLY valid JSON in this format:

{{
  "chief_complaint": "",
  "duration": "",
  "key_findings": [],
  "summary": ""
}}

Medical Text:
{text}

PDF Extracted Text:
{pdf_text}
"""

        # ✅ Correct multimodal call
        generation_kwargs = {
            "max_new_tokens": 2048,
            "return_full_text": False
        }

        if img_obj:
            result = model({
                "text": full_prompt,
                "images": [img_obj]
            }, **generation_kwargs)
        else:
            result = model(full_prompt, **generation_kwargs)

        generated = result[0]["generated_text"]
        
        # Fallback to remove prompt if it's still present
        if generated.startswith(full_prompt):
            generated = generated[len(full_prompt):].strip()

        # Remove everything before actual summary section (if it outputs multiple things)
        if "Summary:" in generated and not generated.strip().startswith("{"):
            generated = generated.split("Summary:")[-1]

        # Remove instruction echo if any
        generated = generated.replace(
            "You are a medical assistant.\nSummarize clearly for a doctor.\n\n",
            ""
        )

        # Let's try to extract JSON from markdown if model wrapped it in ```json ... ```
        if "```json" in generated:
            generated = generated.split("```json")[-1].split("```")[0].strip()
        elif "```" in generated:
            generated = generated.split("```")[-1].split("```")[0].strip()

        return {"summary": generated.strip()}

    return api
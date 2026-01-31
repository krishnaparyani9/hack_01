"""
Inference helper: load model from models/summarizer (or other dir) and summarize input text.

Usage:
  python summarize_text.py --model_dir ./models/summarizer --max_length 128 --input "Long text..."
  or echo "long text" | python summarize_text.py --model_dir ./models/summarizer
"""
import argparse
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
import sys
import os

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_dir", default="./models/summarizer", help="Path to trained model")
    parser.add_argument("--max_length", type=int, default=120)
    parser.add_argument("--min_length", type=int, default=30)
    parser.add_argument("--input", type=str, help="Text to summarize; if missing, read from stdin")
    args = parser.parse_args()

    if not os.path.isdir(args.model_dir):
        raise SystemExit(f"Model directory not found: {args.model_dir}")

    tokenizer = AutoTokenizer.from_pretrained(args.model_dir)
    model = AutoModelForSeq2SeqLM.from_pretrained(args.model_dir)

    summarizer = pipeline("summarization", model=model, tokenizer=tokenizer, device=0 if __import__("torch").cuda.is_available() else -1)

    text = args.input
    if not text:
        text = sys.stdin.read()
    if not text or text.strip() == "":
        raise SystemExit("No input text provided")

    # For long docs you may need to chunk the text - here we do a simple single call
    out = summarizer(text, max_length=args.max_length, min_length=args.min_length, truncation=True)
    print(out[0]["summary_text"])

if __name__ == "__main__":
    main()

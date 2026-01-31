"""
Minimal training script to fine-tune a T5 model for summarization.

Prereqs (run in a Python venv):
  pip install transformers datasets sentencepiece torch

Usage:
  python train_summarizer.py --model t5-small --output_dir ./models/summarizer --epochs 2 --per_device_train_batch_size 4

Notes:
- This trains on the public cnn_dailymail summarization dataset (requires internet).
- For production / HIPAA use, ensure any PHI is handled appropriately and train only on de-identified data.
"""
import argparse
from datasets import load_dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    DataCollatorForSeq2Seq,
    Seq2SeqTrainingArguments,
    Seq2SeqTrainer,
)
import nltk
import os

nltk.download("punkt", quiet=True)

def preprocess_function(examples, tokenizer, max_input_length=1024, max_target_length=128):
    inputs = ["summarize: " + doc for doc in examples["article"]]
    model_inputs = tokenizer(inputs, max_length=max_input_length, truncation=True)
    # Setup the tokenizer for targets
    with tokenizer.as_target_tokenizer():
        labels = tokenizer(examples["highlights"], max_length=max_target_length, truncation=True)
    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="t5-small", help="Pretrained model")
    parser.add_argument("--output_dir", default="./models/summarizer", help="Where to save model")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--per_device_train_batch_size", type=int, default=4)
    parser.add_argument("--per_device_eval_batch_size", type=int, default=4)
    parser.add_argument("--max_train_samples", type=int, default=None, help="Limit for quick runs")
    args = parser.parse_args()

    model_name = args.model
    out_dir = args.output_dir
    os.makedirs(out_dir, exist_ok=True)

    print("Loading dataset (cnn_dailymail)...")
    dataset = load_dataset("cnn_dailymail", "3.0.0")
    # For fast iterate while debugging, you can set small subset via args.max_train_samples

    print("Loading tokenizer and model:", model_name)
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=True)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

    print("Preprocessing dataset...")
    preprocess_fn = lambda examples: preprocess_function(examples, tokenizer)
    tokenized_train = dataset["train"].map(preprocess_fn, batched=True, remove_columns=dataset["train"].column_names)
    tokenized_val = dataset["validation"].map(preprocess_fn, batched=True, remove_columns=dataset["validation"].column_names)

    if args.max_train_samples:
        tokenized_train = tokenized_train.select(range(min(args.max_train_samples, len(tokenized_train))))

    data_collator = DataCollatorForSeq2Seq(tokenizer, model=model)

    training_args = Seq2SeqTrainingArguments(
        output_dir=out_dir,
        evaluation_strategy="steps",
        eval_steps=500,
        per_device_train_batch_size=args.per_device_train_batch_size,
        per_device_eval_batch_size=args.per_device_eval_batch_size,
        predict_with_generate=True,
        logging_steps=200,
        save_total_limit=2,
        num_train_epochs=args.epochs,
        fp16=False,  # set True if using GPU with mixed-precision
        save_strategy="epoch",
        remove_unused_columns=True,
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_train,
        eval_dataset=tokenized_val,
        tokenizer=tokenizer,
        data_collator=data_collator,
    )

    print("Starting training...")
    trainer.train()
    print("Training complete. Saving model to", out_dir)
    trainer.save_model(out_dir)
    tokenizer.save_pretrained(out_dir)
    print("Saved. You can now use the model for inference with summarize_text.py")

if __name__ == "__main__":
    main()

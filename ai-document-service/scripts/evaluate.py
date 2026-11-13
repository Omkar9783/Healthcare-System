#!/usr/bin/env python3
import sys
import difflib
from typing import List, Dict, Any

def compute_cer_wer(reference: str, hypothesis: str) -> Dict[str, float]:
    """
    Computes Character Error Rate (CER) and Word Error Rate (WER).
    """
    # CER
    ref_chars = list(reference)
    hyp_chars = list(hypothesis)
    matcher_char = difflib.SequenceMatcher(None, ref_chars, hyp_chars)
    char_dist = len(ref_chars) + len(hyp_chars) - 2 * sum(block.size for block in matcher_char.get_matching_blocks())
    cer = char_dist / max(1, len(ref_chars))

    # WER
    ref_words = reference.split()
    hyp_words = hypothesis.split()
    matcher_word = difflib.SequenceMatcher(None, ref_words, hyp_words)
    word_dist = len(ref_words) + len(hyp_words) - 2 * sum(block.size for block in matcher_word.get_matching_blocks())
    wer = word_dist / max(1, len(ref_words))

    return {
        "CER": round(min(1.0, cer), 4),
        "WER": round(min(1.0, wer), 4)
    }

def compute_verification_metrics(ground_truth: List[bool], predictions: List[bool]) -> Dict[str, float]:
    """
    Computes False Acceptance Rate (FAR), False Rejection Rate (FRR), and Verification Coverage.
    """
    total = len(ground_truth)
    if total == 0:
        return {"FAR": 0.0, "FRR": 0.0, "Coverage": 0.0}

    # Genuine = True (authentic), Impostor/Tampered = False (fake/altered)
    false_accepts = sum(1 for gt, pred in zip(ground_truth, predictions) if not gt and pred)
    false_rejects = sum(1 for gt, pred in zip(ground_truth, predictions) if gt and not pred)
    total_impostors = sum(1 for gt in ground_truth if not gt)
    total_genuines = sum(1 for gt in ground_truth if gt)

    far = (false_accepts / total_impostors) if total_impostors > 0 else 0.0
    frr = (false_rejects / total_genuines) if total_genuines > 0 else 0.0
    coverage = sum(1 for p in predictions if p is not None) / total

    return {
        "FAR": round(far, 4),
        "FRR": round(frr, 4),
        "Verification_Coverage": round(coverage, 4)
    }

def main():
    print("========================================================")
    print("MediSecure AI Document Verification Evaluation Suite")
    print("========================================================")
    print("\n[1] Sample OCR Benchmark (CER / WER):")
    sample_ref = "MAHARASHTRA STATE RATIONING AUTHORITY MUMBAI"
    sample_hyp = "MAHARASHTRA STATE RATIONING AUTHOR1TY MUMBAI"
    ocr_metrics = compute_cer_wer(sample_ref, sample_hyp)
    print(f"  Reference : '{sample_ref}'")
    print(f"  Hypothesis: '{sample_hyp}'")
    print(f"  Result    : CER: {ocr_metrics['CER'] * 100:.2f}%, WER: {ocr_metrics['WER'] * 100:.2f}%")

    print("\n[2] Sample Verification Benchmark (FAR / FRR / Coverage):")
    gt = [True, True, True, False, False, True, False, True]
    pred = [True, True, False, False, False, True, False, True] # 1 false reject
    verif_metrics = compute_verification_metrics(gt, pred)
    print(f"  FAR (False Acceptance Rate): {verif_metrics['FAR'] * 100:.2f}%")
    print(f"  FRR (False Rejection Rate) : {verif_metrics['FRR'] * 100:.2f}%")
    print(f"  Verification Coverage      : {verif_metrics['Verification_Coverage'] * 100:.2f}%")
    print("\n========================================================")

if __name__ == "__main__":
    main()

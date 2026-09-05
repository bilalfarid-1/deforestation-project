"""
GreenGuard 2.0 - Standalone ML Ensemble Verification Test
Validates that Attention U-Net and U-Net++ checkpoints load and execute
inference on a 16-channel normalized tensor.
"""

import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

import numpy as np
import torch

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from model_loader import get_ensemble_models, predict_ensemble

def test_ensemble():
    print("=" * 65)
    print("[TEST] GreenGuard 2.0 ML Ensemble Model Loader Verification")
    print("=" * 65)

    device = torch.device('cuda:0' if torch.cuda.is_available() else 'cpu')
    print(f"1. Target Device: {device}")

    print("2. Loading Attention U-Net and U-Net++ weights...")
    attn_model, unetpp_model, dev = get_ensemble_models(device)
    assert attn_model is not None, "Attention U-Net failed to initialize"
    assert unetpp_model is not None, "U-Net++ failed to initialize"
    print("   [SUCCESS] Models successfully loaded and cached in memory.")

    print("3. Generating dummy 16-channel patch [16, 256, 256]...")
    dummy_input = np.random.randn(16, 256, 256).astype(np.float32)

    print("4. Executing weighted ensemble inference (0.6 * UNet++ + 0.4 * AttnUNet)...")
    pred_mask, probs = predict_ensemble(dummy_input, weights={'unetpp': 0.6, 'attn_unet': 0.4}, tta=False)

    print(f"   Prediction Mask shape: {pred_mask.shape}, dtype: {pred_mask.dtype}")
    print(f"   Probability Tensor shape: {probs.shape}, dtype: {probs.dtype}")
    print(f"   Unique predicted classes: {np.unique(pred_mask)}")
    assert pred_mask.shape == (256, 256), f"Unexpected mask shape: {pred_mask.shape}"
    assert probs.shape == (3, 256, 256), f"Unexpected prob shape: {probs.shape}"

    print("=" * 65)
    print("[PASSED] ML ENSEMBLE TEST PASSED: Checkpoints loaded and verified!")
    print("=" * 65)

if __name__ == "__main__":
    test_ensemble()

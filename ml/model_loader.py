"""
GreenGuard 2.0 - Deep Learning Model Loader & Ensemble Predictor
Loads trained weights (attn_unet_best.pth & unetpp_best.pth) with EfficientNet-B5 backbones.
Supports CPU and CUDA execution with automatic memory caching and 4-flip TTA.
"""

import os
import sys
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from typing import Dict, Tuple, Optional, Any

try:
    import segmentation_models_pytorch as smp
    SMP_AVAILABLE = True
except ImportError:
    SMP_AVAILABLE = False

WEIGHTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'weights')
ATTN_UNET_PATH = os.path.join(WEIGHTS_DIR, 'attn_unet_best.pth')
UNETPP_PATH = os.path.join(WEIGHTS_DIR, 'unetpp_best.pth')

_CACHED_MODELS = {
    'attn_unet': None,
    'unetpp': None,
    'device': None
}

def get_device() -> torch.device:
    """Returns CUDA device if available, otherwise CPU."""
    if torch.cuda.is_available():
        return torch.device('cuda:0')
    return torch.device('cpu')

def load_attn_unet(device: Optional[torch.device] = None) -> Any:
    """Instantiates Attention U-Net (EfficientNet-B5 + scSE) and loads trained weights."""
    if not SMP_AVAILABLE:
        raise RuntimeError("segmentation_models_pytorch is not installed.")
        
    device = device or get_device()
    model = smp.Unet(
        encoder_name="efficientnet-b5",
        encoder_weights=None,
        in_channels=16,
        classes=3,
        decoder_attention_type="scse"
    )
    
    if os.path.exists(ATTN_UNET_PATH):
        checkpoint = torch.load(ATTN_UNET_PATH, map_location=device, weights_only=False)
        state_dict = checkpoint.get('model_state_dict', checkpoint.get('state_dict', checkpoint))
        model.load_state_dict(state_dict)
        sys.stderr.write(f"[Model Loader] Loaded Attention U-Net weights from: {ATTN_UNET_PATH}\n")
    else:
        sys.stderr.write(f"[Model Loader] Warning: Weights file not found at {ATTN_UNET_PATH}. Using untrained initialization.\n")
        
    model.to(device)
    model.eval()
    return model

def load_unetpp(device: Optional[torch.device] = None) -> Any:
    """Instantiates U-Net++ (EfficientNet-B5) and loads trained weights."""
    if not SMP_AVAILABLE:
        raise RuntimeError("segmentation_models_pytorch is not installed.")

    device = device or get_device()
    model = smp.UnetPlusPlus(
        encoder_name="efficientnet-b5",
        encoder_weights=None,
        in_channels=16,
        classes=3
    )

    if os.path.exists(UNETPP_PATH):
        checkpoint = torch.load(UNETPP_PATH, map_location=device, weights_only=False)
        state_dict = checkpoint.get('model_state_dict', checkpoint.get('state_dict', checkpoint))
        model.load_state_dict(state_dict)
        sys.stderr.write(f"[Model Loader] Loaded U-Net++ weights from: {UNETPP_PATH}\n")
    else:
        sys.stderr.write(f"[Model Loader] Warning: Weights file not found at {UNETPP_PATH}. Using untrained initialization.\n")

    model.to(device)
    model.eval()
    return model

def get_ensemble_models(device: Optional[torch.device] = None) -> Tuple[Any, Any, torch.device]:
    """Retrieves cached models or initializes them once as singletons."""
    global _CACHED_MODELS
    target_device = device or get_device()
    
    if _CACHED_MODELS['attn_unet'] is None or _CACHED_MODELS['device'] != target_device:
        sys.stderr.write(f"[Model Loader] Initializing ensemble on device: {target_device}\n")
        _CACHED_MODELS['attn_unet'] = load_attn_unet(target_device)
        _CACHED_MODELS['unetpp'] = load_unetpp(target_device)
        _CACHED_MODELS['device'] = target_device
        
    return _CACHED_MODELS['attn_unet'], _CACHED_MODELS['unetpp'], target_device

def predict_with_tta(model: nn.Module, x: torch.Tensor) -> torch.Tensor:
    """Performs 4-flip test-time augmentation (TTA) matching Kaggle training."""
    with torch.no_grad():
        p = F.softmax(model(x), dim=1)
        # Flip W
        p += torch.flip(F.softmax(model(torch.flip(x, [3])), dim=1), [3])
        # Flip H
        p += torch.flip(F.softmax(model(torch.flip(x, [2])), dim=1), [2])
        # Flip H + W
        p += torch.flip(F.softmax(model(torch.flip(x, [2, 3])), dim=1), [2, 3])
        return p / 4.0

def predict_ensemble(
    tensor_16ch: np.ndarray,
    weights: Dict[str, float] = {'unetpp': 0.6, 'attn_unet': 0.4},
    tta: bool = True
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Executes weighted ensemble inference on a single 16-channel patch [16, H, W]
    or batch of patches [B, 16, H, W].
    Returns (predicted_class_mask [H, W], class_probabilities [3, H, W]).
    """
    attn_model, unetpp_model, device = get_ensemble_models()
    
    if tensor_16ch.ndim == 3:
        # [16, H, W] -> [1, 16, H, W]
        x = torch.from_numpy(tensor_16ch).unsqueeze(0).float().to(device)
        single_input = True
    else:
        x = torch.from_numpy(tensor_16ch).float().to(device)
        single_input = False

    with torch.no_grad():
        if tta:
            p_attn = predict_with_tta(attn_model, x)
            p_unetpp = predict_with_tta(unetpp_model, x)
        else:
            p_attn = F.softmax(attn_model(x), dim=1)
            p_unetpp = F.softmax(unetpp_model(x), dim=1)

        w_unetpp = weights.get('unetpp', 0.6)
        w_attn = weights.get('attn_unet', 0.4)
        total_w = w_unetpp + w_attn
        w_unetpp /= total_w
        w_attn /= total_w

        p_ensemble = (w_unetpp * p_unetpp) + (w_attn * p_attn)
        pred_mask = torch.argmax(p_ensemble, dim=1)

    pred_mask_np = pred_mask.cpu().numpy()
    probs_np = p_ensemble.cpu().numpy()

    if single_input:
        return pred_mask_np[0], probs_np[0]
    return pred_mask_np, probs_np

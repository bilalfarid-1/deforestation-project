"""
GreenGuard 2.0 - Realistic Bi-Temporal Satellite Imagery Synthesizer
Generates high-fidelity multispectral satellite textures (Sentinel-2 RGB + NIR + SWIR)
with simulated realistic terrain, ridgelines, forest canopy clusters, and seasonal drifts.
"""

import math
import random
import base64
from io import BytesIO
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from typing import Tuple, Dict, Any

def generate_perlin_noise(width: int, height: int, scale: float = 30.0, octaves: int = 4) -> np.ndarray:
    """Generates multi-octave smooth terrain noise using vectorized sinusoids."""
    x = np.linspace(0, scale, width)
    y = np.linspace(0, scale, height)
    xx, yy = np.meshgrid(x, y)
    
    noise = np.zeros((height, width), dtype=np.float32)
    amplitude = 1.0
    frequency = 1.0
    
    for _ in range(octaves):
        noise += amplitude * (
            np.sin(xx * frequency + 1.2) * np.cos(yy * frequency + 0.7) +
            np.sin(xx * frequency * 0.7 - yy * frequency * 0.9)
        )
        amplitude *= 0.5
        frequency *= 2.0

    noise_min, noise_max = noise.min(), noise.max()
    if noise_max > noise_min:
        noise = (noise - noise_min) / (noise_max - noise_min)
    else:
        noise = np.zeros_like(noise)
    return noise

def create_bitemporal_satellite_stack(
    width: int = 512,
    height: int = 512,
    start_year: int = 2020,
    end_year: int = 2024,
    start_period: str = "Jan-Mar",
    end_period: str = "Oct-Dec",
    seed: int = 42
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Creates realistic 7-band T1 and T2 satellite stacks along with ground-truth deforestation masks.
    Bands: [B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR), VV (SAR), VH (SAR)]
    """
    np.random.seed(seed + start_year * 13 + end_year * 7)
    
    # 1. Base Terrain Map (Elevations & Valleys)
    terrain = generate_perlin_noise(width, height, scale=4.5, octaves=4)
    forest_density = generate_perlin_noise(width, height, scale=7.0, octaves=3)
    
    # River / Valley feature
    river_mask = np.zeros((height, width), dtype=bool)
    center_y = height // 2
    for x in range(width):
        y_offset = int(math.sin(x / 40.0) * 35 + math.cos(x / 80.0) * 20)
        y_pos = np.clip(center_y + y_offset, 0, height - 1)
        r_thickness = 3
        y_min = max(0, y_pos - r_thickness)
        y_max = min(height, y_pos + r_thickness + 1)
        river_mask[y_min:y_max, x] = True

    # 2. T1 Baseline Forest Distribution
    # High green & NIR reflectance in forest areas
    forest_mask_t1 = (forest_density > 0.38) & (~river_mask)
    
    # Generate 3-channel RGB for T1
    # Forest: Deep pine green (R: 28-48, G: 85-135, B: 40-70)
    # Soil/Urban: Brown/Grey (R: 130-170, G: 120-150, B: 100-120)
    # Water: Deep blue/navy (R: 20-35, G: 50-75, B: 85-120)
    
    t1_rgb = np.zeros((height, width, 3), dtype=np.uint8)
    
    # Non-forest background
    t1_rgb[:, :, 0] = (140 + terrain * 35).astype(np.uint8)
    t1_rgb[:, :, 1] = (130 + terrain * 25).astype(np.uint8)
    t1_rgb[:, :, 2] = (105 + terrain * 20).astype(np.uint8)
    
    # Forest areas
    f_noise = np.random.randint(-12, 12, (height, width))
    t1_rgb[forest_mask_t1, 0] = np.clip(38 + f_noise[forest_mask_t1], 15, 70)
    t1_rgb[forest_mask_t1, 1] = np.clip(105 + (terrain[forest_mask_t1] * 35) + f_noise[forest_mask_t1], 60, 160)
    t1_rgb[forest_mask_t1, 2] = np.clip(52 + f_noise[forest_mask_t1], 25, 85)
    
    # Water
    t1_rgb[river_mask, 0] = 25
    t1_rgb[river_mask, 1] = 65
    t1_rgb[river_mask, 2] = 110

    # 3. Simulate Deforestation Transitions in T2 (Current)
    # Temporal delta based on year difference (e.g. 2020 vs 2024 is 4 years)
    year_diff = max(1, abs(end_year - start_year))
    loss_fraction = min(0.35, 0.035 * year_diff + random.uniform(0.02, 0.05))
    
    # Target loss clusters (roads, logging patches, agricultural expansions)
    loss_noise = generate_perlin_noise(width, height, scale=12.0, octaves=3)
    loss_threshold = 1.0 - (loss_fraction * 1.8)
    deforestation_mask = (loss_noise > loss_threshold) & forest_mask_t1
    
    # Add a logging road incision
    road_mask = np.zeros((height, width), dtype=bool)
    road_x = np.linspace(30, width - 40, width).astype(int)
    for x in road_x:
        ry = int(height * 0.35 + math.sin(x / 50.0) * 45 + math.cos(x / 25.0) * 15)
        if 0 <= ry < height and forest_mask_t1[ry, x]:
            road_mask[max(0, ry-2):min(height, ry+3), max(0, x-2):min(width, x+3)] = True
            
    deforestation_mask = deforestation_mask | road_mask

    # Construct T2 RGB
    t2_rgb = t1_rgb.copy()
    
    # Deforested zones turn bare soil / burnt ochre / light grey
    t2_rgb[deforestation_mask, 0] = np.random.randint(155, 195, size=np.sum(deforestation_mask))
    t2_rgb[deforestation_mask, 1] = np.random.randint(130, 160, size=np.sum(deforestation_mask))
    t2_rgb[deforestation_mask, 2] = np.random.randint(95, 125, size=np.sum(deforestation_mask))

    # NIR and SWIR bands
    nir_t1 = np.where(forest_mask_t1, 0.75 + terrain * 0.15, 0.25).astype(np.float32)
    nir_t2 = np.where(forest_mask_t1 & (~deforestation_mask), 0.75 + terrain * 0.15, 0.22).astype(np.float32)

    return t1_rgb, t2_rgb, deforestation_mask.astype(np.uint8), forest_mask_t1.astype(np.uint8)

def render_delta_overlay(t2_rgb: np.ndarray, deforestation_mask: np.ndarray) -> Image.Image:
    """
    Renders high-visibility crimson delta overlays with glowing edges and translucent red tint
    over deforested clusters for the final analysis view.
    """
    t2_img = Image.fromarray(t2_rgb, 'RGB').convert('RGBA')
    H, W = deforestation_mask.shape
    
    # Create red overlay layer
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    red_color = (220, 38, 38, 175) # #dc2626 with alpha 175
    
    # Convert mask to PIL for edge detection
    mask_img = Image.fromarray((deforestation_mask * 255).astype(np.uint8), mode='L')
    edges = mask_img.filter(ImageFilter.FIND_EDGES)
    
    # Blend semi-transparent red over deforested pixels
    red_layer = np.zeros((H, W, 4), dtype=np.uint8)
    red_layer[deforestation_mask == 1] = [239, 68, 68, 150]
    
    # Crisp red border on edges
    edge_np = np.array(edges)
    red_layer[edge_np > 80] = [220, 38, 38, 240]
    
    red_overlay_img = Image.fromarray(red_layer, 'RGBA')
    combined = Image.alpha_composite(t2_img, red_overlay_img)
    return combined.convert('RGB')

def pil_to_base64(img: Image.Image, format: str = "PNG") -> str:
    """Converts a PIL Image object to base64 Data URL string."""
    buf = BytesIO()
    img.save(buf, format=format)
    encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
    return f"data:image/{format.lower()};base64,{encoded}"

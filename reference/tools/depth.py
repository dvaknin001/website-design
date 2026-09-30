#!/usr/bin/env python
"""
Bake a depth map for the hero parallax (optional, run only if the hero art changes).

  python tools/depth.py <model.onnx> <in.png> <out.png> [--width 960]

Needs: pip install onnxruntime opencv-python numpy pillow
Model: Depth Anything V2 Small, ONNX:
  https://huggingface.co/onnx-community/depth-anything-v2-small/resolve/main/onnx/model.onnx  (99 MB, not committed)
Output: 8-bit greyscale, white = near, black = far. The site shifts near pixels more than far ones.
"""
import sys
import numpy as np
import cv2
import onnxruntime as ort
from PIL import Image

model, src, dst = sys.argv[1:4]
width = int(sys.argv[sys.argv.index("--width") + 1]) if "--width" in sys.argv else 960

img = Image.open(src).convert("RGB")
w, h = img.size
# network input: multiples of 14, long side ~ 700
scale = 700 / max(w, h)
nw, nh = max(14, round(w * scale / 14) * 14), max(14, round(h * scale / 14) * 14)
x = np.asarray(img.resize((nw, nh), Image.BICUBIC), dtype=np.float32) / 255.0
x = (x - np.array([0.485, 0.456, 0.406], dtype=np.float32)) / np.array([0.229, 0.224, 0.225], dtype=np.float32)
x = x.transpose(2, 0, 1)[None]

sess = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
d = sess.run(None, {sess.get_inputs()[0].name: x})[0]
d = np.squeeze(d).astype(np.float32)

lo, hi = np.percentile(d, 1), np.percentile(d, 99)
d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
d = cv2.resize(d, (width, round(width * h / w)), interpolation=cv2.INTER_CUBIC)
d = cv2.GaussianBlur(d, (0, 0), 2.0)  # soft edges so parallax never tears
Image.fromarray((np.clip(d, 0, 1) * 255).astype(np.uint8)).save(dst)
print("depth ->", dst, d.shape)

import math
import random
from PIL import Image, ImageDraw, ImageFont

width, height = 1024, 1024
image = Image.new("RGB", (width, height), color=(15, 20, 30))
draw = ImageDraw.Draw(image)

# Draw intricate background grid & circuit lines
for x in range(0, width, 32):
    draw.line([(x, 0), (x, height)], fill=(25, 35, 55), width=1)
for y in range(0, height, 32):
    draw.line([(0, y), (width, y)], fill=(25, 35, 55), width=1)

# Asymmetric feature clusters (stars, dots, squares) for high-frequency keypoints
random.seed(42)
for _ in range(150):
    rx = random.randint(60, width - 60)
    ry = random.randint(60, height - 60)
    size = random.randint(4, 16)
    color = random.choice([(0, 220, 255), (255, 180, 0), (255, 60, 100), (80, 255, 160), (255, 255, 255)])
    shape = random.choice(['circle', 'rect', 'cross', 'triangle'])
    if shape == 'circle':
        draw.ellipse([rx, ry, rx + size, ry + size], fill=color)
    elif shape == 'rect':
        draw.rectangle([rx, ry, rx + size, ry + size], fill=color)
    elif shape == 'cross':
        draw.line([rx - size, ry, rx + size, ry], fill=color, width=2)
        draw.line([rx, ry - size, rx, ry + size], fill=color, width=2)
    elif shape == 'triangle':
        draw.polygon([(rx, ry - size), (rx - size, ry + size), (rx + size, ry + size)], fill=color)

# Corner fiducial markers (checkerboards)
def draw_marker(ox, oy, sz):
    draw.rectangle([ox, oy, ox + sz, oy + sz], fill=(255, 255, 255))
    draw.rectangle([ox + 10, oy + 10, ox + sz - 10, oy + sz - 10], fill=(0, 0, 0))
    draw.rectangle([ox + 25, oy + 25, ox + sz - 25, oy + sz - 25], fill=(255, 200, 0))
    draw.rectangle([ox + 35, oy + 35, ox + 55, oy + 55], fill=(0, 0, 0))
    draw.rectangle([ox + 65, oy + 65, ox + 85, oy + 85], fill=(0, 0, 0))

draw_marker(40, 40, 120)
draw_marker(width - 160, 40, 120)
draw_marker(40, height - 160, 120)
draw_marker(width - 160, height - 160, 120)

# Outer decorative border
draw.rectangle([20, 20, width - 20, height - 20], outline=(0, 220, 255), width=5)
draw.rectangle([32, 32, width - 32, height - 32], outline=(255, 180, 0), width=2)

# Central graphic badge - nested hexagons and triangles
cx, cy = width // 2, height // 2
for r in [300, 260, 220, 180, 140]:
    points = []
    for i in range(6):
        angle = math.radians(60 * i + (15 if r % 80 == 0 else 0))
        px = cx + r * math.cos(angle)
        py = cy + r * math.sin(angle)
        points.append((px, py))
    draw.polygon(points, outline=(0, 220, 255) if r % 80 == 0 else (255, 180, 0), width=4)

# Central Robot / Core Glyph
draw.ellipse([cx - 90, cy - 90, cx + 90, cy + 90], fill=(20, 30, 50), outline=(255, 255, 255), width=6)
draw.rectangle([cx - 50, cy - 45, cx + 50, cy + 35], fill=(0, 220, 255))
# Visor
draw.rectangle([cx - 40, cy - 30, cx + 40, cy - 10], fill=(20, 25, 40))
draw.ellipse([cx - 30, cy - 25, cx - 12, cy - 15], fill=(255, 220, 0))
draw.ellipse([cx + 12, cy - 25, cx + 30, cy - 15], fill=(255, 220, 0))
# Antenna
draw.line([cx, cy - 45, cx, cy - 75], fill=(255, 255, 255), width=5)
draw.ellipse([cx - 10, cy - 85, cx + 10, cy - 65], fill=(255, 60, 100))

# Diagonal technical callouts
draw.line([cx - 220, cy - 220, cx - 150, cy - 150], fill=(255, 255, 255), width=3)
draw.line([cx + 220, cy - 220, cx + 150, cy - 150], fill=(255, 255, 255), width=3)
draw.line([cx - 220, cy + 220, cx - 150, cy + 150], fill=(255, 255, 255), width=3)
draw.line([cx + 220, cy + 220, cx + 150, cy + 150], fill=(255, 255, 255), width=3)

# Typography
try:
    font_large = ImageFont.truetype("arial.ttf", 46)
    font_sub = ImageFont.truetype("arial.ttf", 26)
    font_mono = ImageFont.truetype("consola.ttf", 22)
except Exception:
    font_large = font_sub = font_mono = ImageFont.load_default()

draw.text((cx, 100), "WEBAR EXPERIENCE", fill=(255, 255, 255), font=font_large, anchor="mm")
draw.text((cx, 145), "IMAGE TARGET — AR POSTER", fill=(0, 220, 255), font=font_sub, anchor="mm")

draw.text((cx, height - 135), "SCAN WITH CAMERA TO LAUNCH", fill=(255, 200, 0), font=font_large, anchor="mm")
draw.text((cx, height - 90), "MINDAR + THREE.JS RUNTIME • ID: #AR-2026-X1", fill=(180, 200, 220), font=font_mono, anchor="mm")

image.save("public/targets/sample-poster.jpg", quality=95)
image.save("public/targets/sample-poster.png")
print("Successfully generated public/targets/sample-poster.jpg and .png")

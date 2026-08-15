import math
import random
from PIL import Image, ImageDraw, ImageFont

width, height = 1024, 1024
image = Image.new("RGB", (width, height), color=(10, 15, 25))
draw = ImageDraw.Draw(image)

# 1. Bold High-Contrast Outer Framing & Borders (Macro Features for Long Distance)
draw.rectangle([10, 10, width - 10, height - 10], outline=(255, 255, 255), width=8)
draw.rectangle([24, 24, width - 24, height - 24], outline=(0, 229, 255), width=6)
draw.rectangle([40, 40, width - 40, height - 40], outline=(255, 200, 0), width=4)

# 2. Large Corner Fiducial Markers (180x180 px each - instantly recognized at 2+ meters)
def draw_macro_corner_marker(ox, oy, sz):
    # Base white square
    draw.rectangle([ox, oy, ox + sz, oy + sz], fill=(255, 255, 255), outline=(0, 0, 0), width=3)
    # Inner black frame
    inset = 16
    draw.rectangle([ox + inset, oy + inset, ox + sz - inset, oy + sz - inset], fill=(10, 15, 25))
    # Inner bright cyan/yellow checkerboard quadrants (High spatial frequency)
    q_sz = (sz - inset * 2) // 2
    qx = ox + inset
    qy = oy + inset
    # Q1: Top-Left Cyan
    draw.rectangle([qx, qy, qx + q_sz, qy + q_sz], fill=(0, 229, 255))
    # Q2: Top-Right Black with Yellow Dot
    draw.rectangle([qx + q_sz, qy, qx + q_sz * 2, qy + q_sz], fill=(0, 0, 0))
    draw.ellipse([qx + q_sz + 12, qy + 12, qx + q_sz * 2 - 12, qy + q_sz - 12], fill=(255, 200, 0))
    # Q3: Bottom-Left Black with White Diamond
    draw.rectangle([qx, qy + q_sz, qx + q_sz, qy + q_sz * 2], fill=(0, 0, 0))
    draw.polygon([
        (qx + q_sz // 2, qy + q_sz + 8),
        (qx + q_sz - 8, qy + q_sz + q_sz // 2),
        (qx + q_sz // 2, qy + q_sz * 2 - 8),
        (qx + 8, qy + q_sz + q_sz // 2)
    ], fill=(255, 255, 255))
    # Q4: Bottom-Right Yellow
    draw.rectangle([qx + q_sz, qy + q_sz, qx + q_sz * 2, qy + q_sz * 2], fill=(255, 200, 0))

draw_macro_corner_marker(48, 48, 180)
draw_macro_corner_marker(width - 228, 48, 180)
draw_macro_corner_marker(48, height - 228, 180)
draw_macro_corner_marker(width - 228, height - 228, 180)

# 3. Macro Circuit Lines connecting corners to center
cx, cy = width // 2, height // 2
draw.line([(228, 138), (cx - 160, cy - 160)], fill=(0, 229, 255), width=6)
draw.line([(width - 228, 138), (cx + 160, cy - 160)], fill=(0, 229, 255), width=6)
draw.line([(228, height - 138), (cx - 160, cy + 160)], fill=(255, 200, 0), width=6)
draw.line([(width - 228, height - 138), (cx + 160, cy + 160)], fill=(255, 200, 0), width=6)

# 4. Central Massive Macro Emblem (Hexagons + Heavy High-Contrast Solid Geometry)
for r, col, w in [
    (320, (255, 255, 255), 8),
    (270, (0, 229, 255), 10),
    (220, (255, 200, 0), 12),
    (170, (255, 60, 100), 8)
]:
    points = []
    for i in range(6):
        angle = math.radians(60 * i + (15 if r % 80 == 0 else 0))
        px = cx + r * math.cos(angle)
        py = cy + r * math.sin(angle)
        points.append((px, py))
    draw.polygon(points, outline=col, width=w)

# Central Solid Robot / Hologram Core Emblem (Bold Solid Shapes for Long Distance)
draw.ellipse([cx - 120, cy - 120, cx + 120, cy + 120], fill=(15, 25, 45), outline=(255, 255, 255), width=8)

# Bold Robot Head
draw.rectangle([cx - 65, cy - 60, cx + 65, cy + 45], fill=(0, 229, 255), outline=(255, 255, 255), width=4)
# Visor
draw.rectangle([cx - 52, cy - 42, cx + 52, cy - 15], fill=(10, 15, 25))
draw.ellipse([cx - 40, cy - 35, cx - 15, cy - 20], fill=(255, 220, 0))
draw.ellipse([cx + 15, cy - 35, cx + 40, cy - 20], fill=(255, 220, 0))

# Massive Antenna
draw.line([cx, cy - 60, cx, cy - 100], fill=(255, 255, 255), width=8)
draw.ellipse([cx - 16, cy - 116, cx + 16, cy - 84], fill=(255, 60, 100), outline=(255, 255, 255), width=3)

# 5. Distinct Multi-Frequency Mid-Range Scatter Anchors
random.seed(1337)
for _ in range(160):
    rx = random.randint(70, width - 70)
    ry = random.randint(70, height - 70)
    # Avoid center emblem zone
    if math.hypot(rx - cx, ry - cy) < 140:
        continue
    size = random.randint(8, 24)
    color = random.choice([(255, 255, 255), (0, 229, 255), (255, 200, 0), (255, 70, 120), (0, 230, 118)])
    shape = random.choice(['circle', 'rect', 'cross', 'triangle'])
    if shape == 'circle':
        draw.ellipse([rx, ry, rx + size, ry + size], fill=color)
    elif shape == 'rect':
        draw.rectangle([rx, ry, rx + size, ry + size], fill=color)
    elif shape == 'cross':
        draw.line([rx - size, ry, rx + size, ry], fill=color, width=4)
        draw.line([rx, ry - size, rx, ry + size], fill=color, width=4)
    elif shape == 'triangle':
        draw.polygon([(rx, ry - size), (rx - size, ry + size), (rx + size, ry + size)], fill=color)

# 6. High-Contrast Bold Typography
try:
    font_hero = ImageFont.truetype("arial.ttf", 52)
    font_sub = ImageFont.truetype("arial.ttf", 30)
    font_mono = ImageFont.truetype("consola.ttf", 26)
except Exception:
    font_hero = font_sub = font_mono = ImageFont.load_default()

# Top text banner with background pill for 100% legibility
draw.rectangle([cx - 260, 70, cx + 260, 130], fill=(0, 0, 0), outline=(0, 229, 255), width=3)
draw.text((cx, 100), "WEBAR AR TARGET", fill=(255, 255, 255), font=font_hero, anchor="mm")

# Bottom text banner
draw.rectangle([cx - 300, height - 130, cx + 300, height - 70], fill=(0, 0, 0), outline=(255, 200, 0), width=3)
draw.text((cx, height - 100), "LONG-RANGE TRACKING POSTER", fill=(255, 200, 0), font=font_hero, anchor="mm")

image.save("public/targets/sample-poster.jpg", quality=96)
image.save("public/targets/sample-poster.png")
print("SUCCESS: Generated public/targets/sample-poster.jpg with macro-features!")

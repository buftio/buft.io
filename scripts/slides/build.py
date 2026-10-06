# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "tifffile==2026.9.20",
#   "imagecodecs==2026.8.16",
#   "zarr==3.4.0",
#   "pillow==12.3.0",
#   "numpy==2.5.3",
# ]
# ///
import argparse, io, json, math, os, re, urllib.request, xml.etree.ElementTree as ET
import numpy as np, tifffile, zarr
from PIL import Image

SOURCE = 'https://camelyon-dataset.s3.us-west-2.amazonaws.com/CAMELYON16'
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '.slides')

p = argparse.ArgumentParser(description='Cut a CAMELYON16 slide into a deep-zoom tile pyramid.')
p.add_argument('--slide', default='tumor_091')
p.add_argument('--box', default='6000,3500,54500,47000', help='crop x0,y0,x1,y1 in level-0 px')
p.add_argument('--deep-pad', type=int, default=800, help='full-res only within this many level-0 px of a tumor')
p.add_argument('--max-level', type=int, default=1, help='finest source level outside the deep areas')
p.add_argument('--tile', type=int, default=512)
p.add_argument('--q', type=int, default=70)
p.add_argument('--min-tissue', type=float, default=0.004, help='skip tiles with less stained area than this')
p.add_argument('--dry', action='store_true')
a = p.parse_args()


def fetch(name):
    path = os.path.join(ROOT, 'src', name)
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        folder = 'annotations' if name.endswith('.xml') else 'images'
        print(f'downloading {name}', flush=True)
        urllib.request.urlretrieve(f'{SOURCE}/{folder}/{name}', path + '.part')
        os.rename(path + '.part', path)
    return path


tumors = [
    [(float(c.get('X')), float(c.get('Y'))) for c in an.iter('Coordinate')]
    for an in ET.parse(fetch(f'{a.slide}.xml')).getroot().iter('Annotation')
    if an.get('PartOfGroup') == 'Tumor'
]
tif = fetch(f'{a.slide}.tif')
description = tifffile.TiffFile(tif).pages[0].tags['ImageDescription'].value
spacing = re.search(r'DICOM_PIXEL_SPACING[^>]*>&quot;([\d.]+)&quot;', description)
mpp = round(float(spacing.group(1)) * 1000, 4)
grp = zarr.open(tifffile.imread(tif, aszarr=True), mode='r')
levels = [grp[str(i)] for i in range(len(grp))]
last = len(levels) - 1

T, pad = a.tile, a.deep_pad
x0, y0, x1, y1 = map(int, a.box.split(','))
W, H = x1 - x0, y1 - y0
zmax = math.ceil(math.log2(max(W, H) / T))
rects = [
    [min(x for x, _ in t) - pad, min(y for _, y in t) - pad, max(x for x, _ in t) + pad, max(y for _, y in t) + pad]
    for t in tumors
]
out = os.path.join(ROOT, a.slide)
count, size, blank = 0, 0, []
for z in range(zmax + 1):
    L = zmax - z
    s = 2**L
    cols, rows = math.ceil(W / s / T), math.ceil(H / s / T)
    for ty in range(rows):
        for tx in range(cols):
            gx, gy = x0 + tx * T * s, y0 + ty * T * s
            near = any(gx + T * s >= r[0] and gx <= r[2] and gy + T * s >= r[1] and gy <= r[3] for r in rects)
            if L < a.max_level and not near:
                continue
            if L <= last:
                sx, sy = gx // s, gy // s
                w, h = min(T, (x1 - gx) // s), min(T, (y1 - gy) // s)
                arr = np.asarray(levels[L][sy : sy + h, sx : sx + w])
            else:
                lv = 2**last
                n = T * s // lv
                arr = np.asarray(levels[last][gy // lv : gy // lv + n, gx // lv : gx // lv + n])
                im = Image.fromarray(arr)
                f = s / lv
                arr = np.asarray(im.resize((max(1, int(im.width / f)), max(1, int(im.height / f)))))
            if arr.size == 0:
                continue
            rgb = arr.astype(np.int16)
            if ((rgb.max(axis=2) - rgb.min(axis=2)) > 28).mean() < a.min_tissue:
                blank.append(f'{z}/{tx}_{ty}')
                continue
            buf = io.BytesIO()
            Image.fromarray(arr).save(buf, 'webp', quality=a.q, method=4)
            count += 1
            size += buf.tell()
            if not a.dry:
                os.makedirs(f'{out}/{z}', exist_ok=True)
                with open(f'{out}/{z}/{tx}_{ty}.webp', 'wb') as file:
                    file.write(buf.getvalue())
    print(f'z{z} {cols}x{rows} -> {count} tiles {size / 1e6:.1f} MB', flush=True)

meta = dict(
    width=W,
    height=H,
    tile=T,
    zmax=zmax,
    fmt='webp',
    capZ=zmax - a.max_level,
    deep=[[r[0] - x0, r[1] - y0, r[2] - x0, r[3] - y0] for r in rects],
    blank=blank,
    files=count,
    bytes=size,
    mpp=mpp,
    tumors=[
        [[round(x - x0), round(y - y0)] for x, y in t][:: max(1, len(t) // 400)]
        for t in tumors
    ],
    source=f'CAMELYON16 {a.slide}, CC0',
)
if not a.dry:
    with open(f'{out}/slide.json', 'w') as file:
        json.dump(meta, file)
print(f'done: {count} tiles, {size / 1e6:.1f} MB, {len(blank)} blank skipped -> {os.path.relpath(out)}')

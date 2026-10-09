"""Las capturas salen al tamano del dispositivo (x3) y el video las
   dibuja a 660x1428. Mas grandes es memoria tirada; mas chicas se ven
   blandas."""
from PIL import Image
import glob, os
n = 0
for f in glob.glob('img/*.full.jpg'):
    Image.open(f).convert('RGB').resize((660, 1428), Image.LANCZOS) \
        .save(f.replace('.full.jpg', '.jpg'), quality=90, optimize=True)
    os.remove(f)
    n += 1
print(f'  {n} capturas a 660x1428')

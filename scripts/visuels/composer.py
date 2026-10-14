"""
Retouche des photos fournisseur du cadre (jamais publiées telles quelles) :
recadrage, effacement du texte marketing, écran remplacé par une scène Lumipix
simulée comme une vraie photo d'écran LED.

  node scripts/visuels/grilles.ts && python3 scripts/visuels/composer.py
Dépendances : pip install opencv-python-headless numpy
"""
import cv2, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from led import incruster, remplir_vertical
ICI = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(ICI, '../../sources/fournisseur/cadre-pixel-art-led/')
O = os.path.join(ICI, '../../assets/produits/cadre-pixel-art-led/')
Q = [cv2.IMWRITE_JPEG_QUALITY, 93]
img = cv2.imread(R + '4.jpeg')
img = incruster(img, [[674,454],[1297,450],[1301,1067],[685,1071]], 'coucher-soleil-64', halo=0.25, reflet=(660, 1094, 1320, 1190, 0.10), marge=0.008)
cv2.imwrite(O + '01-hero.jpg', img[397:1127, 620:1350], Q)
img = cv2.imread(R + '3.jpeg')
img = remplir_vertical(img, 0, 36, 1160, 318)
for i, (quad, sc) in enumerate([([[463,545],[752,547],[751,837],[461,835]], 'vague-neon-64'), ([[893,365],[1183,365],[1183,656],[893,656]], 'coucher-soleil-64'), ([[1253,103],[1543,103],[1543,393],[1253,393]], 'chat-64')]):
    img = incruster(img, quad, sc, halo=0.22, marge=0.008, graine=i, flou=0.8)
cv2.imwrite(O + '02-ambiance.jpg', img, Q)
img = cv2.imread(R + '2.jpeg')
img = incruster(img, [[566,726],[1148,757],[995,1508],[409,1357]], 'coeur-64', halo=0.3, marge=0.008)
cv2.imwrite(O + '03-cadeau.jpg', img[560:1600, 260:1300], Q)
img = cv2.imread(R + '6.jpeg')
img = incruster(img, [[251,195],[731,238],[716,716],[257,657]], 'horloge-64', halo=0.08, marge=0.01, flou=0.4, bruit=1.0)
cv2.imwrite(O + '04-dimensions.jpg', img[105:835, 140:870], Q)
print('ok')

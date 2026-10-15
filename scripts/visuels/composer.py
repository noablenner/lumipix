"""
Retouche des photos fournisseur du cadre (jamais publiées telles quelles) :
recadrage, effacement du texte marketing, écran remplacé par une scène Lumipix
simulée comme une vraie photo d'écran LED. Chaque visuel est produit en deux
versions : 64x64 (fichier de base) et 32x32 (suffixe -32), affichée sur la page
produit quand la variante 32x32 est choisie.

  node scripts/visuels/grilles.ts && python3 scripts/visuels/composer.py
Dépendances : pip install opencv-python-headless numpy
"""
import cv2, sys, os
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from led import incruster, remplir_vertical
from studio import rendre
ICI = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(ICI, '../../sources/fournisseur/cadre-pixel-art-led/')
O = os.path.join(ICI, '../../assets/produits/cadre-pixel-art-led/')
Q = [cv2.IMWRITE_JPEG_QUALITY, 93]


def nom(base, n):
    return O + (f'{base}.jpg' if n == 64 else f'{base}-32.jpg')


for n in (64, 32):
    # 01 : vraie photo du cadre sur un bureau (4.jpeg), recadrée sur le cadre et recentrée :
    # texte, téléphone et main retirés, bande gauche prolongée à partir du mur et du plateau.
    img = cv2.imread(R + '4.jpeg')
    img = incruster(img, [[673, 451], [1300, 451], [1304, 1071], [679, 1071]], f'coucher-soleil-{n}', halo=0.12, marge=0.006, flou=0.7, bruit=1.5)
    c = img[300:1320, 480:1500].copy()
    k = 633 - 480
    ref = cv2.GaussianBlur(c[:, k:k + 4].astype(np.float32).mean(1, keepdims=True), (0, 0), 1.5)
    c[:, :k] = np.clip(ref + np.random.default_rng(5).normal(0, 1.8, (c.shape[0], k, 3)), 0, 255).astype(np.uint8)
    # pièce assombrie (ambiance de soirée), écran intact ; recadrage sans la bande du bas
    h, w = c.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    lum = 0.42 + 0.4 * np.exp(-(((xx - 507) / 520) ** 2 + ((yy - 470) / 470) ** 2))
    ecran = np.zeros((h, w), np.float32)
    cv2.fillConvexPoly(ecran, np.int32([[673 - 480, 451 - 300], [1300 - 480, 451 - 300], [1304 - 480, 1071 - 300], [679 - 480, 1071 - 300]]), 1.0)
    ecran = cv2.GaussianBlur(ecran, (0, 0), 3)
    lum = lum * (1 - ecran) + ecran
    c = np.clip(c.astype(np.float32) * lum[..., None] * np.float32([1.05, 0.92, 0.95]) ** (1 - ecran[..., None]), 0, 255).astype(np.uint8)
    cv2.imwrite(nom('01-hero', n), c[10:975, 25:990], Q)

    img = cv2.imread(R + '3.jpeg')
    img = remplir_vertical(img, 0, 36, 1160, 318)
    for i, (quad, sc) in enumerate([([[463,545],[752,547],[751,837],[461,835]], 'vague-neon'), ([[893,365],[1183,365],[1183,656],[893,656]], 'coucher-soleil'), ([[1253,103],[1543,103],[1543,393],[1253,393]], 'chat')]):
        img = incruster(img, quad, f'{sc}-{n}', halo=0.22, marge=0.008, graine=i, flou=0.8)
    cv2.imwrite(nom('02-ambiance', n), img, Q)

    img = cv2.imread(R + '2.jpeg')
    img = incruster(img, [[566,726],[1148,757],[995,1508],[409,1357]], f'coeur-{n}', halo=0.3, marge=0.008)
    cv2.imwrite(nom('03-cadeau', n), img[560:1600, 260:1300], Q)

    # 05, 06 : rendus de studio 100 % synthétiques
    cv2.imwrite(nom('05-studio-neon', n), rendre(f'vague-neon-{n}', 1600, 1600, yaw=0.35), [cv2.IMWRITE_JPEG_QUALITY, 92])
    cv2.imwrite(nom('06-studio-chat', n), rendre(f'chat-{n}', 1600, 1600, yaw=-0.22), [cv2.IMWRITE_JPEG_QUALITY, 92])

# 04 : cotes du modèle 64x64 uniquement (dimensions du 32x32 non mesurées)
img = cv2.imread(R + '6.jpeg')
img = incruster(img, [[251,195],[731,238],[716,716],[257,657]], 'horloge-64', halo=0.08, marge=0.01, flou=0.4, bruit=1.0)
cv2.imwrite(O + '04-dimensions.jpg', img[105:835, 140:870], Q)
print('ok')

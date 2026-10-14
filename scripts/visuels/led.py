"""Simulation photographique d'un écran LED, puis incrustation dans une photo."""
import json, cv2, numpy as np

import os
GRILLES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'grilles.json')))


def _lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def _srgb(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def couleurs(nom):
    g = GRILLES[nom]
    n = len(g)
    arr = np.zeros((n, n, 3), np.float32)
    for y, ligne in enumerate(g):
        for x, c in enumerate(ligne):
            if c:
                arr[y, x] = [int(c[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    # Une LED allumée émet à pleine saturation : on pousse saturation et intensité
    hsv = cv2.cvtColor(arr, cv2.COLOR_RGB2HSV)
    allume = hsv[..., 2] > 0.02
    hsv[..., 1] = np.where(allume, np.clip(hsv[..., 1] * 1.25, 0, 1), 0)
    v = np.clip(hsv[..., 2], 0, 1)
    # les tons vifs montent, les fonds sombres restent sombres (contraste d'un vrai écran)
    hsv[..., 2] = np.where(allume, np.where(v > 0.35, v ** 0.75, v * 0.8), 0)
    return cv2.cvtColor(hsv, cv2.COLOR_HSV2RGB)


def noyau(cell):
    """Diode carrée aux coins arrondis, plus chaude au centre."""
    t = (np.arange(cell) + 0.5) / cell - 0.5
    x, y = np.meshgrid(t, t)
    d = (np.abs(x) ** 4 + np.abs(y) ** 4) ** 0.25
    forme = np.clip((0.40 - d) / 0.05, 0, 1)
    coeur = np.exp(-((x ** 2 + y ** 2) / 0.035))
    return (0.8 * forme + 0.9 * coeur * forme)[..., None]


def texture(nom, cell=24, gain=1.6):
    c = _lin(couleurs(nom))
    n = c.shape[0]
    emission = np.kron(c, np.ones((cell, cell, 1), np.float32)) * np.tile(noyau(cell), (n, n, 1))
    bloom = (
        emission
        + 0.30 * cv2.GaussianBlur(emission, (0, 0), cell * 0.35)
        + 0.22 * cv2.GaussianBlur(emission, (0, 0), cell * 1.5)
        + 0.12 * cv2.GaussianBlur(emission, (0, 0), cell * 5)
    )
    ton = 1 - np.exp(-gain * bloom)  # les LED très lumineuses tirent vers le blanc, comme sur une photo
    return _srgb(ton)  # RGB 0..1


def incruster(photo, quad, nom, halo=0.35, reflet=None, flou=0.6, bruit=2.0, graine=0, marge=0.006, anneau=0.012):
    tex = (texture(nom)[..., ::-1] * 255).astype(np.float32)  # BGR
    h, w = tex.shape[:2]
    q = np.float32(quad)
    cq = q.mean(0)
    q = cq + (q - cq) * (1 + marge)
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), q)
    H, W = photo.shape[:2]
    ecran = cv2.warpPerspective(tex, M, (W, H), flags=cv2.INTER_AREA)
    masque = cv2.warpPerspective(np.ones((h, w), np.float32), M, (W, H), flags=cv2.INTER_AREA)
    masque = cv2.GaussianBlur(masque, (0, 0), 0.7)[..., None]
    if flou:
        ecran = cv2.GaussianBlur(ecran, (0, 0), flou)
    base = photo.astype(np.float32)
    # bande de raccord : efface les dernières LED d'origine sous le bord du cadre
    q2 = cq + (q - cq) * (1 + marge + anneau)
    M2 = cv2.getPerspectiveTransform(np.float32([[0, 0], [w, 0], [w, h], [0, h]]), q2)
    large = cv2.warpPerspective(np.ones((h, w), np.float32), M2, (W, H), flags=cv2.INTER_AREA)
    large = cv2.GaussianBlur(large, (0, 0), 1.0)[..., None]
    bande = np.clip(large - masque, 0, 1)
    base = base * (1 - bande) + base * 0.25 * bande
    # le fond de l'écran est noir : on remplace entièrement la zone
    sortie = base * (1 - masque) + ecran * masque
    # lumière diffusée sur le cadre et l'environnement proche
    taille = max(W, H)
    diffus = cv2.GaussianBlur(ecran * masque, (0, 0), taille / 70) * 0.7 + cv2.GaussianBlur(ecran * masque, (0, 0), taille / 22) * 0.6
    sortie += diffus * halo * (1 - masque)
    # reflet sur le plateau sous le cadre (zone donnée par l'appelant)
    if reflet is not None:
        x0, y0, x1, y1, force = reflet
        bas = ecran[int(q[:, 1].min()):int(q[:, 1].max())][::-1]
        hh = min(y1 - y0, bas.shape[0])
        r = cv2.GaussianBlur(bas[:hh, x0:x1], (0, 0), taille / 120)
        fondu = np.linspace(1, 0, hh, dtype=np.float32)[:, None, None] ** 1.6
        sortie[y0:y0 + hh, x0:x1] += r * fondu * force
    rng = np.random.default_rng(graine)
    sortie += rng.normal(0, bruit, sortie.shape) * masque
    return np.clip(sortie, 0, 255).astype(np.uint8)


def remplir_vertical(img, x0, y0, x1, y1, bruit=2.5, graine=1):
    haut = img[max(0, y0 - 6):y0, x0:x1].astype(np.float32).mean(0)
    bas = img[y1:y1 + 6, x0:x1].astype(np.float32).mean(0)
    t = np.linspace(0, 1, y1 - y0)[:, None, None]
    zone = haut[None] * (1 - t) + bas[None] * t
    zone = cv2.GaussianBlur(zone, (0, 0), 6)
    zone += np.random.default_rng(graine).normal(0, bruit, zone.shape)
    img[y0:y1, x0:x1] = np.clip(zone, 0, 255).astype(np.uint8)
    return img

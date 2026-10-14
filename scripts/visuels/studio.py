"""
Packshot de studio du cadre, 100 % synthétique (aucune photo fournisseur) :
cadre noir mat en vue de trois quarts, écran LED simulé, plateau sombre et
brillant, lumière de l'écran qui se diffuse sur le décor, reflet, ombre de
contact, vignettage et grain.

  node scripts/visuels/grilles.ts && python3 scripts/visuels/studio.py <scene> <sortie.jpg> [largeur] [hauteur] [angle]

Visuels publiés : voir scripts/visuels/composer.py (fonction studio).
"""
import os, sys, math
import cv2, numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from led import texture  # noqa: E402

SS = 2  # suréchantillonnage (anticrénelage)


def flou(img, sigma):
    """Flou gaussien rapide : les grands rayons sont calculés sur une image réduite."""
    if sigma < 12:
        return cv2.GaussianBlur(img, (0, 0), sigma)
    f = max(2, int(sigma / 6))
    h, w = img.shape[:2]
    petit = cv2.resize(img, (max(1, w // f), max(1, h // f)), interpolation=cv2.INTER_AREA)
    petit = cv2.GaussianBlur(petit, (0, 0), sigma / f)
    grand = cv2.resize(petit, (w, h), interpolation=cv2.INTER_LINEAR)
    return grand if grand.ndim == img.ndim else grand[..., None]


def projeter(points, W, H, yaw, pitch, dist, focale):
    """Projection perspective d'un objet tourné (yaw autour de Y, pitch autour de X)."""
    cy, sy = math.cos(yaw), math.sin(yaw)
    cp, sp = math.cos(pitch), math.sin(pitch)
    sortie = []
    for x, y, z in points:
        x, z = x * cy + z * sy, -x * sy + z * cy
        y, z = y * cp - z * sp, y * sp + z * cp
        z += dist
        sortie.append((W / 2 + focale * x / z, H / 2 - focale * y / z))
    return np.float32(sortie)


def poly(masque_shape, pts):
    m = np.zeros(masque_shape, np.float32)
    cv2.fillConvexPoly(m, np.int32(np.round(pts * 16)), 1.0, lineType=cv2.LINE_AA, shift=4)
    return m[..., None]


def rendre(scene, W=1800, H=1800, yaw=-0.42, teinte=(255, 79, 168), graine=3):
    W2, H2 = W * SS, H * SS
    rng = np.random.default_rng(graine)
    yy, xx = np.mgrid[0:H2, 0:W2].astype(np.float32)
    u, v = xx / W2, yy / H2

    # --- Décor : fond très sombre, halo lointain, plateau brillant ---
    horizon = 0.64
    fond = np.zeros((H2, W2, 3), np.float32)
    base = np.array([10, 9, 16], np.float32)
    fond[:] = base
    lointain = np.exp(-(((u - 0.5) / 0.5) ** 2 + ((v - 0.42) / 0.38) ** 2))
    fond += lointain[..., None] * np.array([34, 26, 52], np.float32)
    # lumière froide rasante en haut à droite (contre-jour), lumière chaude en bas à gauche
    fond += np.exp(-(((u - 0.92) / 0.35) ** 2 + ((v - 0.1) / 0.4) ** 2))[..., None] * np.array([40, 30, 18], np.float32)
    fond += np.exp(-(((u - 0.05) / 0.3) ** 2 + ((v - 0.6) / 0.3) ** 2))[..., None] * np.array([18, 10, 30], np.float32)
    plateau = (v > horizon).astype(np.float32)[..., None]
    prof = np.clip((v - horizon) / (1 - horizon), 0, 1)[..., None]
    fond = fond * (1 - plateau) + plateau * (np.array([7, 7, 11], np.float32) + prof * np.array([8, 7, 12], np.float32))
    # liseré de lumière sur l'arête du plateau
    arete = np.exp(-((v - horizon) * H2 / (2.2 * SS)) ** 2)[..., None]
    fond += arete * np.array([40, 34, 52], np.float32) * np.exp(-((u - 0.5) / 0.35) ** 2)[..., None]

    # --- Géométrie du cadre (26 x 26 x 1,7 cm, unité = largeur) ---
    L, P = 1.0, 0.065
    hauteur_pied = 0.0
    y0 = hauteur_pied
    coins = {
        'avant': [(-L / 2, y0, -P / 2), (L / 2, y0, -P / 2), (L / 2, y0 + L, -P / 2), (-L / 2, y0 + L, -P / 2)],
        'arriere': [(-L / 2, y0, P / 2), (L / 2, y0, P / 2), (L / 2, y0 + L, P / 2), (-L / 2, y0 + L, P / 2)],
    }
    focale = 2.35 * W2
    dist = 4.9
    pitch = -0.07
    centre_y = -0.5  # recentre l'objet verticalement

    decalage = np.zeros(2, np.float32)

    def proj(pts):
        p = projeter([(x, y + centre_y, z) for x, y, z in pts], W2, H2, yaw, pitch, dist, focale)
        return p + decalage

    # centrage : le cadre au milieu, sa base posée vers 78 % de la hauteur
    tous = proj(coins['avant'] + coins['arriere'])
    decalage[0] = W2 / 2 - (tous[:, 0].min() + tous[:, 0].max()) / 2
    decalage[1] = H2 * 0.78 - tous[:, 1].max()

    av = proj(coins['avant'])  # bas-gauche, bas-droit, haut-droit, haut-gauche
    ar = proj(coins['arriere'])
    cote = np.float32([av[1], ar[1], ar[2], av[2]]) if yaw < 0 else np.float32([av[0], ar[0], ar[3], av[3]])
    dessus = np.float32([av[3], av[2], ar[2], ar[3]])

    # Écran : retrait de 4,2 % dans la face avant
    r = 0.042
    ecr3 = [(-L / 2 + r, y0 + r, -P / 2), (L / 2 - r, y0 + r, -P / 2), (L / 2 - r, y0 + L - r, -P / 2), (-L / 2 + r, y0 + L - r, -P / 2)]
    ecr = proj(ecr3)

    # --- Texture LED ---
    tex = (texture(scene, cell=40, gain=1.75)[..., ::-1] * 255).astype(np.float32)
    th, tw = tex.shape[:2]
    src = np.float32([[0, th], [tw, th], [tw, 0], [0, 0]])  # bas-gauche, bas-droit, haut-droit, haut-gauche
    M = cv2.getPerspectiveTransform(src, ecr)
    ecran = cv2.warpPerspective(tex, M, (W2, H2), flags=cv2.INTER_AREA)
    m_ecran = cv2.warpPerspective(np.ones((th, tw), np.float32), M, (W2, H2), flags=cv2.INTER_AREA)[..., None]
    lumiere = ecran * m_ecran

    # --- Lumière de l'écran sur le décor (avant de poser l'objet) ---
    for sigma, force in ((W2 / 30, 0.55), (W2 / 10, 0.45), (W2 / 4, 0.35)):
        fond += flou(lumiere, sigma) * force
    # reflet du cadre allumé sur le plateau
    bas_ecran = int(ecr[:, 1].max())
    haut_ecran = int(ecr[:, 1].min())
    hauteur_reflet = min(H2 - bas_ecran, bas_ecran - haut_ecran)
    if hauteur_reflet > 0:
        bande = lumiere[bas_ecran - hauteur_reflet:bas_ecran][::-1]
        bande = flou(cv2.GaussianBlur(bande, (0, 0), W2 / 220), W2 / 90)
        fondu = (np.linspace(1, 0, hauteur_reflet, dtype=np.float32) ** 2.2)[:, None, None]
        decal = int(H2 * 0.012)
        fin = min(H2, bas_ecran + decal + hauteur_reflet)
        fond[bas_ecran + decal:fin] += bande[: fin - bas_ecran - decal] * fondu[: fin - bas_ecran - decal] * 0.38

    # ombre de contact sous le cadre
    contact = np.zeros((H2, W2), np.float32)
    base_pts = np.int32([av[0], av[1], ar[1], ar[0]])
    cv2.fillConvexPoly(contact, base_pts, 1.0)
    contact = flou(contact, W2 / 120)
    fond *= (1 - 0.75 * np.clip(contact * 3, 0, 1))[..., None]

    img = fond

    # --- Faces du cadre (plastique noir mat, arêtes éclairées) ---
    def plastique(couleur, grad_u, grad_v, grain=2.0):
        c = np.array(couleur, np.float32)
        champ = c * (1 + grad_u * (0.5 - u) + grad_v * (0.5 - v))[..., None]
        return champ + rng.normal(0, grain, (H2, W2, 1)).astype(np.float32)

    m_cote = poly((H2, W2), cote)
    m_dessus = poly((H2, W2), dessus)
    m_avant = poly((H2, W2), av)
    img = img * (1 - m_cote) + plastique((15, 15, 20), 0.6, 0.5) * m_cote
    img = img * (1 - m_dessus) + plastique((30, 29, 38), 0.4, 0.0) * m_dessus
    face = plastique((22, 22, 28), 0.55, 0.9)
    # lumière de l'écran qui rebondit sur la bordure
    face += flou(lumiere, W2 / 160) * 0.35
    img = img * (1 - m_avant) + face * m_avant

    # arêtes : liseré de lumière (contre-jour) en haut et sur le côté
    def arete_ligne(a, b, couleur, epaisseur):
        calque = np.zeros((H2, W2), np.float32)
        cv2.line(calque, tuple(int(t) for t in np.round(a * 16)), tuple(int(t) for t in np.round(b * 16)), 1.0, max(1, int(round(epaisseur * SS))), cv2.LINE_AA, 4)
        calque = cv2.GaussianBlur(calque, (0, 0), 0.8 * SS)
        return calque[..., None] * np.array(couleur, np.float32)

    img += arete_ligne(av[3], av[2], (120, 116, 140), 1.2)
    img += arete_ligne(av[2], av[1], (70, 66, 86), 1.0)

    # léger creux autour de l'écran
    img *= 1 - 0.55 * np.clip(poly((H2, W2), proj([(x * 1.012, y, z) for x, y, z in ecr3])) - m_ecran, 0, 1)

    # --- Écran ---
    img = img * (1 - m_ecran) + ecran * m_ecran
    # vitre : très léger reflet diagonal
    reflet = np.clip(1 - np.abs((u - 0.38) + (v - 0.42) * 0.9) / 0.18, 0, 1) ** 3
    img += (reflet[..., None] * m_ecran) * 10
    # halo lumineux au-dessus de tout (bloom optique)
    img += flou(lumiere, W2 / 260) * 0.18 * (1 - m_ecran)

    # --- Finition : vignettage, grain, réduction ---
    vign = 1 - 0.55 * (((u - 0.5) / 0.75) ** 2 + ((v - 0.47) / 0.75) ** 2)
    img *= np.clip(vign, 0.35, 1)[..., None]
    img = cv2.resize(img, (W, H), interpolation=cv2.INTER_AREA)
    img += np.random.default_rng(graine + 1).normal(0, 2.2, img.shape).astype(np.float32)
    return np.clip(img, 0, 255).astype(np.uint8)


if __name__ == '__main__':
    scene, sortie = sys.argv[1], sys.argv[2]
    W = int(sys.argv[3]) if len(sys.argv) > 3 else 1800
    H = int(sys.argv[4]) if len(sys.argv) > 4 else 1800
    yaw = float(sys.argv[5]) if len(sys.argv) > 5 else -0.42
    cv2.imwrite(sortie, rendre(scene, W, H, yaw=yaw), [cv2.IMWRITE_JPEG_QUALITY, 92])

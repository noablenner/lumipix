/*
 * Encodeur PNG minimal à palette (type 3, 8 bits), sans dépendance :
 * fonctionne dans le navigateur, dans Node et dans les fonctions Cloudflare
 * (compression via CompressionStream, natif partout).
 */

const TABLE_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(octets: Uint8Array): number {
  let c = 0xffffffff;
  for (const o of octets) c = TABLE_CRC[(c ^ o) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function bloc(type: string, donnees: Uint8Array): Uint8Array {
  const sortie = new Uint8Array(12 + donnees.length);
  const vue = new DataView(sortie.buffer);
  vue.setUint32(0, donnees.length);
  for (let i = 0; i < 4; i++) sortie[4 + i] = type.charCodeAt(i);
  sortie.set(donnees, 8);
  vue.setUint32(8 + donnees.length, crc32(sortie.subarray(4, 8 + donnees.length)));
  return sortie;
}

async function compresser(octets: Uint8Array): Promise<Uint8Array> {
  const flux = new Blob([octets as BlobPart]).stream().pipeThrough(new CompressionStream('deflate'));
  return new Uint8Array(await new Response(flux).arrayBuffer());
}

/**
 * @param largeur  largeur en pixels
 * @param hauteur  hauteur en pixels
 * @param indices  un indice de palette par pixel (largeur x hauteur)
 * @param palette  couleurs '#rrggbb' (256 au maximum)
 */
export async function encoderPng(largeur: number, hauteur: number, indices: Uint8Array, palette: readonly string[]): Promise<Uint8Array> {
  const ihdr = new Uint8Array(13);
  const v = new DataView(ihdr.buffer);
  v.setUint32(0, largeur);
  v.setUint32(4, hauteur);
  ihdr.set([8, 3, 0, 0, 0], 8);

  const plte = new Uint8Array(palette.length * 3);
  palette.forEach((c, i) => plte.set([1, 3, 5].map((k) => parseInt(c.slice(k, k + 2), 16)), i * 3));

  // une ligne = octet de filtre (0) + indices
  const brut = new Uint8Array((largeur + 1) * hauteur);
  for (let y = 0; y < hauteur; y++) brut.set(indices.subarray(y * largeur, (y + 1) * largeur), y * (largeur + 1) + 1);

  const parties = [
    Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    bloc('IHDR', ihdr),
    bloc('PLTE', plte),
    bloc('IDAT', await compresser(brut)),
    bloc('IEND', new Uint8Array()),
  ];
  const total = new Uint8Array(parties.reduce((n, p) => n + p.length, 0));
  let pos = 0;
  for (const p of parties) {
    total.set(p, pos);
    pos += p.length;
  }
  return total;
}

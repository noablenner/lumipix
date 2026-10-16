/*
 * Client Stripe minimal (API REST, sans SDK) et vérification des webhooks.
 * Tout passe par fetch et Web Crypto : aucune dépendance dans le Worker.
 */

/** Version d'API figée : la forme des objets lus par le Worker ne change pas sans nous. */
export const VERSION_API_STRIPE = '2025-03-31.basil';

export type Parametres = Record<string, unknown>;

/** { a: { b: [1, 2] } } → a[b][0]=1&a[b][1]=2 (format attendu par l'API Stripe). */
export function encoderFormulaire(params: Parametres): string {
  const paires: [string, string][] = [];
  const parcourir = (valeur: unknown, cle: string) => {
    if (valeur === undefined || valeur === null) return;
    if (Array.isArray(valeur)) valeur.forEach((v, i) => parcourir(v, `${cle}[${i}]`));
    else if (typeof valeur === 'object') for (const [k, v] of Object.entries(valeur)) parcourir(v, `${cle}[${k}]`);
    else paires.push([cle, String(valeur)]);
  };
  for (const [k, v] of Object.entries(params)) parcourir(v, k);
  return new URLSearchParams(paires).toString();
}

export class ErreurStripe extends Error {
  statut: number;
  detail: string;
  constructor(statut: number, detail: string) {
    super(`Stripe ${statut} : ${detail}`);
    this.statut = statut;
    this.detail = detail;
  }
}

export async function appelStripe<T = Record<string, any>>(
  cle: string,
  methode: 'GET' | 'POST',
  chemin: string,
  params: Parametres = {},
  options: { idempotence?: string } = {},
): Promise<T> {
  const corps = encoderFormulaire(params);
  const url = `https://api.stripe.com/v1/${chemin}${methode === 'GET' && corps ? `?${corps}` : ''}`;
  const entetes: Record<string, string> = {
    Authorization: `Bearer ${cle}`,
    'Stripe-Version': VERSION_API_STRIPE,
  };
  if (methode === 'POST') entetes['Content-Type'] = 'application/x-www-form-urlencoded';
  if (options.idempotence) entetes['Idempotency-Key'] = options.idempotence;
  const reponse = await fetch(url, { method: methode, headers: entetes, body: methode === 'POST' ? corps : undefined });
  const json = (await reponse.json().catch(() => ({}))) as any;
  if (!reponse.ok) throw new ErreurStripe(reponse.status, json?.error?.message ?? reponse.statusText);
  return json as T;
}

const encodeur = new TextEncoder();

function hex(octets: ArrayBuffer): string {
  return [...new Uint8Array(octets)].map((o) => o.toString(16).padStart(2, '0')).join('');
}

function egalEnTempsConstant(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signer(secret: string, contenu: string): Promise<string> {
  const cle = await crypto.subtle.importKey('raw', encodeur.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', cle, encodeur.encode(contenu)));
}

/**
 * Vérifie l'en-tête Stripe-Signature (t=…,v1=…) : HMAC SHA-256 de « t.corps »
 * avec le secret du webhook, horodatage à moins de 5 minutes (anti-rejeu).
 */
export async function verifierSignature(corps: string, entete: string | null, secret: string, maintenant = Date.now()): Promise<boolean> {
  if (!entete || !secret) return false;
  const morceaux = entete.split(',').map((m) => m.trim().split('='));
  const t = morceaux.find(([k]) => k === 't')?.[1];
  const signatures = morceaux.filter(([k]) => k === 'v1').map(([, v]) => v ?? '');
  if (!t || !/^\d+$/.test(t) || !signatures.length) return false;
  if (Math.abs(maintenant / 1000 - Number(t)) > 300) return false;
  const attendue = await signer(secret, `${t}.${corps}`);
  return signatures.some((s) => egalEnTempsConstant(s, attendue));
}

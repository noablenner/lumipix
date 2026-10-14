interface ImportMetaEnv {
  /** Jeton Cloudflare Web Analytics (public, sans cookie). Vide = pas d'analytics. */
  readonly PUBLIC_CF_WEB_ANALYTICS_TOKEN?: string;
  /** Défini par astro.config.mjs selon CIBLE_DEPLOIEMENT. */
  readonly PUBLIC_PREVISUALISATION?: string;
  readonly PUBLIC_FONCTIONS_SERVEUR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

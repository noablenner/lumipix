interface ImportMetaEnv {
  /** Jeton Cloudflare Web Analytics (public, sans cookie). Vide = pas d'analytics. */
  readonly PUBLIC_CF_WEB_ANALYTICS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

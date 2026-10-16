/*
 * Schéma de la base D1 (binding DB). Appliqué automatiquement par le Worker
 * au premier accès (CREATE ... IF NOT EXISTS) : aucune migration manuelle.
 * Pour faire évoluer une table existante, ajouter une instruction ALTER à la
 * fin de la liste, jamais modifier une instruction déjà déployée.
 *
 * Montants en centimes d'euro TTC (entiers). Dates en ISO 8601 (UTC).
 */
export const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS commandes (
    numero TEXT PRIMARY KEY,
    stripe_session_id TEXT NOT NULL UNIQUE,
    stripe_payment_intent TEXT,
    stripe_customer TEXT,
    mode TEXT NOT NULL CHECK (mode IN ('test', 'live')),
    statut TEXT NOT NULL CHECK (statut IN ('payee', 'remboursee', 'partiellement_remboursee')),
    email TEXT NOT NULL,
    telephone TEXT,
    nom_client TEXT,
    livraison_nom TEXT,
    livraison_ligne1 TEXT,
    livraison_ligne2 TEXT,
    livraison_code_postal TEXT,
    livraison_ville TEXT,
    livraison_pays TEXT,
    sous_total INTEGER NOT NULL,
    remise INTEGER NOT NULL DEFAULT 0,
    port INTEGER NOT NULL DEFAULT 0,
    tva INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    rembourse INTEGER NOT NULL DEFAULT 0,
    facture_id TEXT,
    facture_numero TEXT,
    facture_url TEXT,
    facture_pdf TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    utm_term TEXT,
    referent TEXT,
    page_arrivee TEXT,
    cree_le TEXT NOT NULL,
    payee_le TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS commandes_email ON commandes (email)`,
  `CREATE INDEX IF NOT EXISTS commandes_payment_intent ON commandes (stripe_payment_intent)`,

  // Une commande fournisseur par fournisseur et par commande client (brief §6.5)
  `CREATE TABLE IF NOT EXISTS commandes_fournisseur (
    id TEXT PRIMARY KEY,
    commande TEXT NOT NULL REFERENCES commandes (numero),
    fournisseur TEXT NOT NULL,
    statut TEXT NOT NULL DEFAULT 'a_passer'
      CHECK (statut IN ('a_passer', 'passee', 'expediee', 'livree', 'probleme', 'remboursee')),
    reference_fournisseur TEXT,
    transporteur TEXT,
    numero_suivi TEXT,
    url_suivi TEXT,
    note TEXT,
    cree_le TEXT NOT NULL,
    passee_le TEXT,
    expediee_le TEXT,
    livree_le TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS commandes_fournisseur_statut ON commandes_fournisseur (statut)`,

  `CREATE TABLE IF NOT EXISTS lignes_commande (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commande TEXT NOT NULL REFERENCES commandes (numero),
    commande_fournisseur TEXT REFERENCES commandes_fournisseur (id),
    produit TEXT NOT NULL,
    variante TEXT NOT NULL,
    nom TEXT NOT NULL,
    quantite INTEGER NOT NULL,
    prix_unitaire INTEGER NOT NULL,
    total INTEGER NOT NULL,
    tva INTEGER NOT NULL DEFAULT 0,
    fournisseur_url TEXT,
    fournisseur_id_produit TEXT,
    fournisseur_id_variante TEXT,
    fournisseur_libelle TEXT,
    prix_achat_unitaire INTEGER,
    port_achat INTEGER
  )`,
  `CREATE INDEX IF NOT EXISTS lignes_commande_commande ON lignes_commande (commande)`,

  // Avis clients, liés à une commande vérifiée, modérés depuis l'admin (phase 5)
  `CREATE TABLE IF NOT EXISTS avis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commande TEXT NOT NULL REFERENCES commandes (numero),
    produit TEXT NOT NULL,
    jeton TEXT NOT NULL UNIQUE,
    note INTEGER CHECK (note BETWEEN 1 AND 5),
    titre TEXT,
    texte TEXT,
    prenom TEXT,
    statut TEXT NOT NULL DEFAULT 'demande' CHECK (statut IN ('demande', 'en_attente', 'publie', 'refuse')),
    cree_le TEXT NOT NULL,
    depose_le TEXT,
    modere_le TEXT
  )`,

  // Inscriptions email en double opt-in (phase 5)
  `CREATE TABLE IF NOT EXISTS inscriptions (
    email TEXT PRIMARY KEY,
    statut TEXT NOT NULL CHECK (statut IN ('en_attente', 'confirmee', 'desinscrite')),
    jeton TEXT NOT NULL UNIQUE,
    source TEXT,
    cree_le TEXT NOT NULL,
    confirmee_le TEXT
  )`,

  // Événements Stripe déjà traités (rejeu idempotent du webhook)
  `CREATE TABLE IF NOT EXISTS evenements_stripe (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    traite_le TEXT NOT NULL
  )`,
];

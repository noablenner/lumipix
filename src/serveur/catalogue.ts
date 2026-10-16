/*
 * Catalogue côté serveur : prix, frais de port, délais ET bloc fournisseur.
 * Généré au build par scripts/catalogue-serveur.ts dans catalogue.genere.ts
 * (ignoré par git), puis embarqué dans le code du Worker. Il n'est jamais
 * copié dans dist/ : le navigateur n'y a pas accès.
 */
import type { ArticleCatalogue } from '../lib/panier-calcul.ts';

export interface VarianteServeur {
  id: string;
  nom: string;
  prix_ttc: number;
  disponible: boolean;
  fournisseur: {
    libelle: string;
    id_variante: string | null;
    prix_achat_ttc: number;
    port_achat: number;
  };
}

export interface ProduitServeur {
  slug: string;
  nom: string;
  /** Vendable sur ce déploiement (actif, ou brouillon hors production). */
  vendable: boolean;
  frais_de_port: number;
  delai: { min: number; max: number };
  variantes: VarianteServeur[];
  fournisseur: { nom: string; url: string; id_produit: string };
}

/** Vue du catalogue attendue par calculerPanier (produits vendables uniquement). */
export function versArticles(catalogue: ProduitServeur[]): ArticleCatalogue[] {
  return catalogue
    .filter((p) => p.vendable)
    .map((p) => ({
      slug: p.slug,
      nom: p.nom,
      lien: `/produits/${p.slug}`,
      image: '',
      frais_de_port: p.frais_de_port,
      delai: p.delai,
      variantes: p.variantes.map(({ id, nom, prix_ttc, disponible }) => ({ id, nom, prix_ttc, disponible })),
    }));
}

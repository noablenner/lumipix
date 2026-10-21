/*
 * Données structurées JSON-LD (brief §8). Aucune donnée inventée : tout vient
 * de la fiche produit et de src/config/. Le nom du président n'y figure jamais.
 */
import { SOCIETE } from '../config/societe';
import { BOUTIQUE } from '../config/boutique';
import { variantesAvecPrix, type ProduitPublic } from './catalogue';

const url = (chemin: string) => new URL(chemin, SOCIETE.urlSite).href;

export function jsonLdOrganisation() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': url('/#organisation'),
    name: SOCIETE.marque,
    url: url('/'),
    logo: url('/favicon.svg'),
  };
}

export function jsonLdSiteWeb() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': url('/#site'),
    name: SOCIETE.marque,
    url: url('/'),
    inLanguage: 'fr-FR',
    publisher: { '@id': url('/#organisation') },
  };
}

export function jsonLdFilAriane(elements: { nom: string; chemin: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: elements.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.nom, item: url(e.chemin) })),
  };
}

export function jsonLdFaq(questions: { question: string; reponse: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.reponse },
    })),
  };
}

export function jsonLdProduit(p: ProduitPublic, image: string) {
  const chemin = `/produits/${p.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nom,
    description: p.description_courte ?? p.seo.meta_description,
    image: url(image),
    brand: { '@type': 'Brand', name: SOCIETE.marque },
    url: url(chemin),
    offers: variantesAvecPrix(p).map((v) => ({
      '@type': 'Offer',
      name: `${p.nom} ${v.nom}`,
      sku: `${p.slug}-${v.id}`,
      url: url(`${chemin}?variante=${v.id}`),
      price: v.prix_ttc.toFixed(2),
      priceCurrency: BOUTIQUE.devise,
      availability: v.disponible ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': url('/#organisation') },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: { '@type': 'MonetaryAmount', value: p.frais_de_port.toFixed(2), currency: BOUTIQUE.devise },
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'FR' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: p.delai_livraison.min_jours_ouvres,
            maxValue: p.delai_livraison.max_jours_ouvres,
            unitCode: 'DAY',
          },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'FR',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: BOUTIQUE.delaiRetractationJours,
        returnMethod: 'https://schema.org/ReturnByMail',
      },
    })),
    // AggregateRating : uniquement quand de vrais avis vérifiés existeront (phase 5).
  };
}

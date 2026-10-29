// Who publishes the site: shown in the legal notice and cited in the terms. Values starting with "[À COMPLÉTER"
// must be replaced before going live: they are highlighted on the pages so they cannot be missed.
export const LEGAL = {
  product: "Applycast",
  site: "getapplycast.com",
  publisherName: "[À COMPLÉTER : prénom et nom]",
  legalForm: "Entreprise individuelle",
  siren: "[À COMPLÉTER : numéro SIREN]",
  address: "[À COMPLÉTER : adresse professionnelle]",
  vat: "[À COMPLÉTER : numéro de TVA, ou « TVA non applicable, art. 293 B du CGI »]",
  email: "benjaminguichardpro@gmail.com",
  mediator: "[À COMPLÉTER : nom, adresse postale et site du médiateur de la consommation]",
  // Hosting provider of the site (public details as published by third parties; check vercel.com before launch).
  host: { name: "Vercel Inc.", address: "340 S Lemon Ave #4133, Walnut, CA 91789, USA", phone: "+1 559 288 7060" },
  updatedEn: "October 29, 2026",
  updatedFr: "29 octobre 2026",
} as const;

export const isToFill = (value: string) => value.startsWith("[À COMPLÉTER");

// Who publishes the site: shown in the legal notice and cited in the terms. Values starting with "[À COMPLÉTER"
// must be replaced before going live: they are highlighted on the pages so they cannot be missed.
export const LEGAL = {
  product: "Applycast",
  site: "getapplycast.com",
  publisherName: "Benjamin Guichard",
  legalForm: "Entreprise individuelle",
  siren: "977798156",
  address: "72 rue du faubourg poissonnière, 75010, Paris",
  vat: "TVA non applicable, art. 293 B du CGI",
  email: "benjaminguichardpro@gmail.com",
  // Consumer mediator (name, postal address, website). Leave EMPTY if you have none: the service is then offered to
  // professionals only, and the consumer sections disappear from the legal pages.
  mediator: "",
  // Hosting provider of the site (public details as published by third parties; check vercel.com before launch).
  host: { name: "Vercel Inc.", address: "340 S Lemon Ave #4133, Walnut, CA 91789, USA", phone: "+1 559 288 7060" },
  updatedEn: "October 29, 2026",
  updatedFr: "29 octobre 2026",
} as const;

export const isToFill = (value: string) => value.startsWith("[À COMPLÉTER");

// Selling to consumers requires a consumer mediator; without one, the terms say the service is for professionals only.
export const hasMediator = LEGAL.mediator.trim() !== "";

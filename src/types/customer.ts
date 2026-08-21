export type CustomerType = 'Individual' | 'Business';

// The language a customer's invoice documents are generated in. Always present — there is no
// "unset", "null", or "inherit" state (spec invoice-document-localization.md, requirement 1).
export type DocumentLanguage = 'Estonian' | 'English';

export type Customer = {
  id?: string;
  // Optional: null when absent (canonicalized by the backend), required non-blank for Business.
  companyName: string | null;
  customerName: string;
  // Optional for every customer regardless of classification: null when absent.
  customerAddress: string | null;
  postalCode: string | null;
  customerEmail: string;
  // Optional: null when absent, required non-blank for Business.
  customerTaxVatId: string | null;
  customerType: CustomerType;
  documentLanguage: DocumentLanguage;
};

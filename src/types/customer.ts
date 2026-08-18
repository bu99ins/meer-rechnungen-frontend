export type CustomerType = 'Individual' | 'Business';

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
};

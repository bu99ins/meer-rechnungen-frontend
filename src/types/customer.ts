export type CustomerType = 'Individual' | 'Business';

export type Customer = {
  id?: string;
  companyName: string;
  customerName: string;
  customerAddress: string;
  postalCode: string;
  customerEmail: string;
  customerTaxVatId: string;
  customerType: CustomerType;
};

export type Sender = {
  id?: string;
  senderCompanyName: string;
  senderFullName: string;
  senderAddress: string;
  senderTaxVatId: string;
  bankDetails: string;
  // Optional: "" when absent, never null/undefined — matches the backend's "absent" convention.
  senderPhone: string;
  senderEmail: string;
};

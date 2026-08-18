export type Sender = {
  id?: string;
  senderCompanyName: string;
  senderFullName: string;
  senderAddress: string;
  senderTaxVatId: string;
  bankDetails: string;
  // Optional: null when absent (canonicalized by the backend) — see
  // specs/optional-sender-and-customer-fields.md implementation notes, as amended.
  senderPhone: string | null;
  senderEmail: string | null;
};

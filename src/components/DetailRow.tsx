import React from 'react';

type Props = {
  label: string;
  value?: string | null;
};

// A label/value row on a detail page (customer, sender). A row whose value is empty or
// whitespace-only is omitted entirely — label and all — rather than showing a dash or an empty
// value (spec optional-sender-and-customer-fields.md requirement 10). `break-words` stops a long
// unbreakable value (an email address, an IBAN) from pushing the page wider than the viewport at
// 320px — the same fix as CardField's value text, for the same reason.
const DetailRow: React.FC<Props> = ({ label, value }) => {
  if (!value || !value.trim()) return null;
  return (
    <div className="grid grid-cols-12 py-2">
      <div className="col-span-4 text-sm text-brand-gray">{label}</div>
      <div className="col-span-8 text-sm text-gray-900 break-words">{value}</div>
    </div>
  );
};

export default DetailRow;

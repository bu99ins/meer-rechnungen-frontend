import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from '../../components/Loading';
import { useSendersStore } from '../../store/sendersStore';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

// A row whose value is empty or whitespace-only is omitted entirely — label and all — rather than
// showing a dash or an empty value (spec optional-sender-and-customer-fields.md requirement 10).
const Row: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value || !value.trim()) return null;
  return (
    <div className="grid grid-cols-12 py-2">
      <div className="col-span-4 text-sm text-brand-gray">{label}</div>
      <div className="col-span-8 text-sm text-gray-900">{value}</div>
    </div>
  );
};

const SenderDetails: React.FC = () => {
  const { id } = useParams();
  const { current, fetchOne, loading } = useSendersStore();

  useEffect(() => { if (id) fetchOne(id); }, [id]);

  if (!current || loading) return <Loading label="Loading sender..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{current.senderCompanyName}</h1>
          <p className="text-sm text-brand-gray">{current.senderFullName}</p>
        </div>
        <Link to={`/senders/${id}/edit`} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-brand-deep text-white hover:bg-brand-deep-dark">
          <PencilSquareIcon className="h-4 w-4" /> Edit
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <Row label="Company" value={current.senderCompanyName} />
        <Row label="Full Name" value={current.senderFullName} />
        <Row label="Address" value={current.senderAddress} />
        <Row label="Tax/VAT" value={current.senderTaxVatId} />
        <Row label="Bank Details" value={current.bankDetails} />
        <Row label="Phone" value={current.senderPhone} />
        <Row label="Email" value={current.senderEmail} />
      </div>
    </div>
  );
};

export default SenderDetails;

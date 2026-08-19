import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from '../../components/Loading';
import DetailRow from '../../components/DetailRow';
import { useSendersStore } from '../../store/sendersStore';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

const SenderDetails: React.FC = () => {
  const { id } = useParams();
  const { current, fetchOne, loading } = useSendersStore();

  useEffect(() => { if (id) fetchOne(id); }, [id]);

  if (!current || loading) return <Loading label="Loading sender..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 break-words">{current.senderCompanyName}</h1>
          <p className="text-sm text-brand-gray">{current.senderFullName}</p>
        </div>
        <Link to={`/senders/${id}/edit`} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-brand-deep text-white hover:bg-brand-deep-dark">
          <PencilSquareIcon className="h-4 w-4" /> Edit
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <DetailRow label="Company" value={current.senderCompanyName} />
        <DetailRow label="Full Name" value={current.senderFullName} />
        <DetailRow label="Address" value={current.senderAddress} />
        <DetailRow label="Tax/VAT" value={current.senderTaxVatId} />
        <DetailRow label="Bank Details" value={current.bankDetails} />
        <DetailRow label="Phone" value={current.senderPhone} />
        <DetailRow label="Email" value={current.senderEmail} />
      </div>
    </div>
  );
};

export default SenderDetails;

import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from '../../components/Loading';
import DetailRow from '../../components/DetailRow';
import { useCustomersStore } from '../../store/customersStore';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { resolveCustomerDisplayName } from '../../lib/customerDisplay.js';

const CustomerDetails: React.FC = () => {
  const { id } = useParams();
  const { current, fetchOne, loading } = useCustomersStore();

  useEffect(() => { if (id) fetchOne(id); }, [id]);

  if (!current || loading) return <Loading label="Loading customer..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 break-words">{resolveCustomerDisplayName(current)}</h1>
          <p className="text-sm text-brand-gray">Contact: {current.customerName}</p>
        </div>
        <Link to={`/customers/${id}/edit`} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-brand-deep text-white hover:bg-brand-deep-dark">
          <PencilSquareIcon className="h-4 w-4" /> Edit
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <DetailRow label="Company" value={current.companyName} />
        <DetailRow label="Contact" value={current.customerName} />
        <DetailRow label="Email" value={current.customerEmail} />
        <DetailRow label="Address" value={current.customerAddress} />
        <DetailRow label="Postal Code" value={current.postalCode} />
        <DetailRow label="Tax/VAT" value={current.customerTaxVatId} />
      </div>
    </div>
  );
};

export default CustomerDetails;

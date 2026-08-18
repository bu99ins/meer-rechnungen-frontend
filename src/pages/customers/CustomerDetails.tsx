import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from '../../components/Loading';
import { useCustomersStore } from '../../store/customersStore';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { resolveCustomerDisplayName } from '../../lib/customerDisplay.js';

// A row whose value is empty or whitespace-only is omitted entirely — label and all — rather than
// showing a dash or an empty value (spec optional-sender-and-customer-fields.md requirement 10).
const Row: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value || !value.trim()) return null;
  return (
    <div className="grid grid-cols-12 py-2">
      <div className="col-span-4 text-sm text-gray-500">{label}</div>
      <div className="col-span-8 text-sm text-gray-900">{value}</div>
    </div>
  );
};

const CustomerDetails: React.FC = () => {
  const { id } = useParams();
  const { current, fetchOne, loading } = useCustomersStore();

  useEffect(() => { if (id) fetchOne(id); }, [id]);

  if (!current || loading) return <Loading label="Loading customer..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{resolveCustomerDisplayName(current)}</h1>
          <p className="text-sm text-gray-600">Contact: {current.customerName}</p>
        </div>
        <Link to={`/customers/${id}/edit`} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
          <PencilSquareIcon className="h-4 w-4" /> Edit
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <Row label="Company" value={current.companyName} />
        <Row label="Contact" value={current.customerName} />
        <Row label="Email" value={current.customerEmail} />
        <Row label="Address" value={current.customerAddress} />
        <Row label="Postal Code" value={current.postalCode} />
        <Row label="Tax/VAT" value={current.customerTaxVatId} />
      </div>
    </div>
  );
};

export default CustomerDetails;

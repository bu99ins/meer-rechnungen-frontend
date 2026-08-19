import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCustomersStore } from '../../store/customersStore';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import CardField from '../../components/CardField';
import { useIsNarrow } from '../../hooks/useIsNarrow';
import { isActionTarget } from '../../lib/rowActivation';
import { EyeIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { resolveCustomerDisplayName } from '../../lib/customerDisplay.js';
import type { Customer } from '../../types/customer';

const CustomersList: React.FC = () => {
  const { list, total, offset, limit, loading, error, fetch, setPage, remove } = useCustomersStore();
  const [toDelete, setToDelete] = useState<string | null>(null);
  const isNarrow = useIsNarrow();
  const navigate = useNavigate();

  useEffect(() => { fetch(); }, [offset, limit]);

  const onChangePage = (nextOffset: number, nextLimit: number) => {
    setPage(nextOffset, nextLimit);
    fetch(nextOffset, nextLimit);
  };

  const rows = useMemo(() => list, [list]);

  const openDetail = (id: string) => navigate(`/customers/${id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
          <p className="text-sm text-brand-gray">Manage your customers.</p>
        </div>
        <Link to="/customers/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-brand-deep text-white text-sm hover:bg-brand-deep-dark">
          <PlusIcon className="h-4 w-4" /> New Customer
        </Link>
      </div>

      {loading && rows.length === 0 ? (
        <Loading label="Loading customers..." />
      ) : rows.length === 0 ? (
        <EmptyState title="No customers" description="Create your first customer." actionText="New Customer" actionTo="/customers/new" />
      ) : isNarrow ? (
        <div className="space-y-3">
          {rows.map((c) => (
            <CustomerCard key={c.id} customer={c} onOpen={() => openDetail(c.id!)} onDelete={() => setToDelete(c.id!)} />
          ))}
          <Pagination total={total} offset={offset} limit={limit} onChange={onChangePage} />
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray uppercase tracking-wider">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-brand-gray uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 cursor-default"
                    onDoubleClick={(e) => {
                      if (!isActionTarget(e.target)) openDetail(c.id!);
                    }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{resolveCustomerDisplayName(c)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.customerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{c.customerEmail}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Link to={`/customers/${c.id}`} className="inline-flex items-center px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" title="View">
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link to={`/customers/${c.id}/edit`} className="inline-flex items-center px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" title="Edit">
                          <PencilSquareIcon className="h-4 w-4" />
                        </Link>
                        <button onClick={() => setToDelete(c.id!)} className="inline-flex items-center px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50" title="Delete">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination total={total} offset={offset} limit={limit} onChange={onChangePage} />
          </div>
        </div>
      )}

      {error && <div className="p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete customer?"
        description="This action cannot be undone."
        confirmText="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) {
            await remove(toDelete);
            setToDelete(null);
          }
        }}
      />
    </div>
  );
};

const CustomerCard: React.FC<{
  customer: Customer;
  onOpen: () => void;
  onDelete: () => void;
}> = ({ customer, onOpen, onDelete }) => (
  <div
    data-testid="customer-card"
    className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 cursor-pointer"
    onClick={(e) => {
      if (!isActionTarget(e.target)) onOpen();
    }}
  >
    {/* The one real link on the card — View has been dropped from the action row (req 20), so
        this is the keyboard/assistive-technology route to the detail page (req 15). Its own
        click bubbles into the card's onClick above, where isActionTarget recognises it and the
        card doesn't try to navigate a second time. */}
    <Link to={`/customers/${customer.id}`} className="block text-sm font-semibold text-gray-900 hover:underline">
      {resolveCustomerDisplayName(customer)}
    </Link>
    <div className="grid grid-cols-2 gap-3">
      <CardField label="Contact" value={customer.customerName} />
      <CardField label="Email" value={customer.customerEmail} />
    </div>
    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
      <Link to={`/customers/${customer.id}/edit`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm" title="Edit">
        <PencilSquareIcon className="h-4 w-4" /> Edit
      </Link>
      <button onClick={onDelete} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-sm" title="Delete">
        <TrashIcon className="h-4 w-4" /> Delete
      </button>
    </div>
  </div>
);

export default CustomersList;

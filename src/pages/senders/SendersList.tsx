import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSendersStore } from '../../store/sendersStore';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import Loading from '../../components/Loading';
import EmptyState from '../../components/EmptyState';
import CardField from '../../components/CardField';
import { useIsNarrow } from '../../hooks/useIsNarrow';
import { isActionTarget } from '../../lib/rowActivation';
import { EyeIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Sender } from '../../types/sender';

const SendersList: React.FC = () => {
  const { list, total, offset, limit, loading, error, fetch, setPage, remove } = useSendersStore();
  const [toDelete, setToDelete] = useState<string | null>(null);
  const isNarrow = useIsNarrow();
  const navigate = useNavigate();

  useEffect(() => { fetch(); }, [offset, limit]);

  const onChangePage = (nextOffset: number, nextLimit: number) => {
    setPage(nextOffset, nextLimit);
    fetch(nextOffset, nextLimit);
  };

  const rows = useMemo(() => list, [list]);

  const openDetail = (id: string) => navigate(`/senders/${id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Senders</h1>
          <p className="text-sm text-brand-gray">Manage your company sender profiles.</p>
        </div>
        <Link to="/senders/new" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-brand-deep text-white text-sm hover:bg-brand-deep-dark">
          <PlusIcon className="h-4 w-4" /> New Sender
        </Link>
      </div>

      {loading && rows.length === 0 ? (
        <Loading label="Loading senders..." />
      ) : rows.length === 0 ? (
        <EmptyState title="No senders" description="Create your first sender." actionText="New Sender" actionTo="/senders/new" />
      ) : isNarrow ? (
        <div className="space-y-3">
          {rows.map((s) => (
            <SenderCard key={s.id} sender={s} onOpen={() => openDetail(s.id!)} onDelete={() => setToDelete(s.id!)} />
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray uppercase tracking-wider">Full Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-gray uppercase tracking-wider">Tax/VAT</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-brand-gray uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-gray-50 cursor-default"
                    onDoubleClick={(e) => {
                      if (!isActionTarget(e.target)) openDetail(s.id!);
                    }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{s.senderCompanyName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.senderFullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.senderTaxVatId}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Link to={`/senders/${s.id}`} className="inline-flex items-center px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" title="View">
                          <EyeIcon className="h-4 w-4" />
                        </Link>
                        <Link to={`/senders/${s.id}/edit`} className="inline-flex items-center px-2 py-1 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50" title="Edit">
                          <PencilSquareIcon className="h-4 w-4" />
                        </Link>
                        <button onClick={() => setToDelete(s.id!)} className="inline-flex items-center px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50" title="Delete">
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
        title="Delete sender?"
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

const SenderCard: React.FC<{
  sender: Sender;
  onOpen: () => void;
  onDelete: () => void;
}> = ({ sender, onOpen, onDelete }) => (
  <div
    data-testid="sender-card"
    className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 cursor-pointer"
    onClick={(e) => {
      if (!isActionTarget(e.target)) onOpen();
    }}
  >
    {/* The one real link on the card — View has been dropped from the action row (req 20), so
        this is the keyboard/assistive-technology route to the detail page (req 15). Its own
        click bubbles into the card's onClick above, where isActionTarget recognises it and the
        card doesn't try to navigate a second time. */}
    <Link to={`/senders/${sender.id}`} className="block text-sm font-semibold text-gray-900 hover:underline">
      {sender.senderCompanyName}
    </Link>
    <div className="grid grid-cols-2 gap-3">
      <CardField label="Full Name" value={sender.senderFullName} />
      <CardField label="Tax/VAT" value={sender.senderTaxVatId} />
    </div>
    <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-100">
      <Link to={`/senders/${sender.id}/edit`} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm" title="Edit">
        <PencilSquareIcon className="h-4 w-4" /> Edit
      </Link>
      <button onClick={onDelete} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 text-sm" title="Delete">
        <TrashIcon className="h-4 w-4" /> Delete
      </button>
    </div>
  </div>
);

export default SendersList;

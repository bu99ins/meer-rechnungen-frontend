import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextArea, TextInput } from '../../components/Form';
import Loading from '../../components/Loading';
import { useSendersStore } from '../../store/sendersStore';

type Props = { mode: 'create' | 'edit' };

const SenderForm: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const store = useSendersStore();

  const [senderCompanyName, setSenderCompanyName] = useState('');
  const [senderFullName, setSenderFullName] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderTaxVatId, setSenderTaxVatId] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && id) {
      store.fetchOne(id);
    }
    // store.fetchOne, not the whole `store` object: Zustand's create() defines action functions
    // once and set() only ever replaces state properties, so fetchOne's reference is stable across
    // renders — safe to depend on without refetching every time an unrelated store field changes.
  }, [mode, id, store.fetchOne]);

  // Populates local form state once the fetch above actually lands. This is a SEPARATE effect,
  // reactive on store.current itself, rather than reading store.current from inside the fetch's
  // .then() callback: Zustand's set() replaces the whole state object rather than mutating it, so
  // a callback that closes over the `store` captured at mount time would keep reading that
  // mount-time snapshot (current: undefined) forever, never the value the fetch just loaded.
  useEffect(() => {
    if (mode === 'edit' && store.current) {
      const s = store.current;
      setSenderCompanyName(s.senderCompanyName);
      setSenderFullName(s.senderFullName);
      setSenderAddress(s.senderAddress);
      setSenderTaxVatId(s.senderTaxVatId);
      setBankDetails(s.bankDetails);
      setSenderPhone(s.senderPhone);
      setSenderEmail(s.senderEmail);
    }
  }, [mode, store.current]);

  // Address, Tax/VAT ID and Bank Details are required by the backend (spec requirement 5/6) — the
  // form must block submission on them itself instead of letting a blank value reach the backend
  // and come back as a 400. Phone and Email are optional and deliberately excluded here.
  const canSave =
    senderCompanyName && senderFullName && senderAddress && senderTaxVatId && bankDetails;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const payload = { senderCompanyName, senderFullName, senderAddress, senderTaxVatId, bankDetails, senderPhone, senderEmail };
    try {
      if (mode === 'create') {
        const created = await store.create(payload);
        navigate(`/senders/${created.id}`);
      } else if (mode === 'edit' && id) {
        const updated = await store.update(id, payload);
        navigate(`/senders/${updated.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Guards on identity, not just presence: navigating from editing one sender straight to
  // another (same mounted component, id param changes) would otherwise leave the previous
  // sender's data on screen — fully interactive and savable onto the new id — until the new
  // fetch resolves.
  if (mode === 'edit' && (!store.current || store.current.id !== id)) {
    return <Loading label="Loading sender..." />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{mode === 'create' ? 'New Sender' : `Edit ${senderCompanyName || 'Sender'}`}</h1>
          <p className="text-sm text-gray-600">Provide sender details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button disabled={!canSave || saving} type="submit" className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? 'Saving...' : mode === 'create' ? 'Create Sender' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextInput id="senderCompanyName" label="Company Name" value={senderCompanyName} onChange={(e) => setSenderCompanyName(e.target.value)} required />
        <TextInput id="senderFullName" label="Full Name" value={senderFullName} onChange={(e) => setSenderFullName(e.target.value)} required />
        <TextInput id="senderTaxVatId" label="Tax/VAT ID" value={senderTaxVatId} onChange={(e) => setSenderTaxVatId(e.target.value)} required />
        <TextInput id="bankDetails" label="Bank Details" value={bankDetails} onChange={(e) => setBankDetails(e.target.value)} required />
        <TextInput id="senderPhone" label="Phone" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
        <TextInput id="senderEmail" label="Email" type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
        <div className="sm:col-span-2">
          <TextArea id="senderAddress" label="Address" value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} rows={3} required />
        </div>
      </div>
    </form>
  );
};

export default SenderForm;

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RequiredLegend, SelectInput, TextArea, TextInput } from '../../components/Form';
import Loading from '../../components/Loading';
import { useCustomersStore } from '../../store/customersStore';
import { requiresCompanyFields } from '../../lib/customerClassification.js';
import { resolveCustomerDisplayName } from '../../lib/customerDisplay.js';
import type { CustomerType } from '../../types/customer';

type Props = { mode: 'create' | 'edit' };

const CustomerForm: React.FC<Props> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const store = useCustomersStore();

  const [companyName, setCompanyName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerTaxVatId, setCustomerTaxVatId] = useState('');
  // Individual by default, matching the backend's own default on Create (spec requirement 1).
  const [customerType, setCustomerType] = useState<CustomerType>('Individual');
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
      const c = store.current;
      // The API returns null for these fields when absent (canonicalized server-side); local
      // form state stays a plain string throughout the component's lifetime — coalescing here,
      // once, keeps every downstream read (canSave's .trim() calls, controlled inputs) simple.
      setCompanyName(c.companyName ?? '');
      setCustomerName(c.customerName);
      setCustomerAddress(c.customerAddress ?? '');
      setPostalCode(c.postalCode ?? '');
      setCustomerEmail(c.customerEmail);
      setCustomerTaxVatId(c.customerTaxVatId ?? '');
      setCustomerType(c.customerType);
    }
  }, [mode, store.current]);

  const isBusiness = requiresCompanyFields(customerType);
  // Trimmed, not raw truthiness: a whitespace-only value is "no value", same as the backend's own
  // NotEmpty() check treats it.
  const canSave =
    customerName.trim() &&
    customerEmail.trim() &&
    (!isBusiness || (companyName.trim() && customerTaxVatId.trim()));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    // customerType is always sent explicitly — for Update, the backend rejects an omitted value
    // (see specs/customer-classification-toggle.md requirement 2): relying on any default here
    // would either corrupt data or fail validation on every save.
    const payload = { companyName, customerName, customerAddress, postalCode, customerEmail, customerTaxVatId, customerType };
    try {
      if (mode === 'create') {
        const created = await store.create(payload);
        navigate(`/customers/${created.id}`);
      } else if (mode === 'edit' && id) {
        const updated = await store.update(id, payload);
        navigate(`/customers/${updated.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  // Guards on identity, not just presence: navigating from editing one customer straight to
  // another (same mounted component, id param changes) would otherwise leave the previous
  // customer's data on screen — fully interactive and savable onto the new id — until the new
  // fetch resolves. Comparing store.current.id to the route id keeps the loading state (and the
  // population effect above, which already depends on store.current) correctly in sync.
  if (mode === 'edit' && (!store.current || store.current.id !== id)) {
    return <Loading label="Loading customer..." />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {mode === 'create' ? 'New Customer' : `Edit ${resolveCustomerDisplayName({ companyName, customerName }) || 'Customer'}`}
          </h1>
          <p className="text-sm text-brand-gray">Provide customer details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
          <button disabled={!canSave || saving} type="submit" className="px-3 py-2 rounded-md bg-brand-deep text-white hover:bg-brand-deep-dark disabled:opacity-50">
            {saving ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Save Changes'}
          </button>
        </div>
      </div>

      <RequiredLegend />

      <div className="bg-white border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectInput
          id="customerType"
          label="Customer Type"
          value={customerType}
          onChange={(e) => setCustomerType(e.target.value as CustomerType)}
          className="sm:col-span-2"
        >
          <option value="Individual">Individual</option>
          <option value="Business">Business</option>
        </SelectInput>
        {isBusiness && (
          <TextInput id="companyName" label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        )}
        <TextInput id="customerName" label="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        <TextInput id="customerEmail" label="Email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
        <TextInput id="postalCode" label="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
        {isBusiness && (
          <TextInput id="customerTaxVatId" label="Tax/VAT ID" value={customerTaxVatId} onChange={(e) => setCustomerTaxVatId(e.target.value)} required />
        )}
        <div className="sm:col-span-2">
          <TextArea id="customerAddress" label="Address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} rows={3} />
        </div>
      </div>
    </form>
  );
};

export default CustomerForm;

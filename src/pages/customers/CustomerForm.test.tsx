import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CustomerForm from './CustomerForm';
import { useCustomersStore } from '../../store/customersStore';
import type { Customer } from '../../types/customer';

vi.mock('../../store/customersStore', () => ({
  useCustomersStore: vi.fn(),
}));

const businessCustomer: Customer = {
  id: 'c1',
  companyName: 'Acme GmbH',
  customerName: 'Erika Musterfrau',
  customerAddress: 'Musterstrasse 1',
  postalCode: '10115',
  customerEmail: 'erika@acme.example',
  customerTaxVatId: 'DE123456789',
  customerType: 'Business',
};

const individualCustomer: Customer = {
  ...businessCustomer,
  id: 'c2',
  companyName: '',
  customerTaxVatId: '',
  customerType: 'Individual',
};

type CustomersStoreShape = ReturnType<typeof useCustomersStore>;

function mockStore(overrides: Partial<CustomersStoreShape> = {}): CustomersStoreShape {
  const mocked = {
    current: undefined,
    loading: false,
    fetchOne: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'new-id' }),
    update: vi.fn().mockResolvedValue({ id: 'c1' }),
    ...overrides,
  } as unknown as CustomersStoreShape;
  vi.mocked(useCustomersStore).mockReturnValue(mocked);
  return mocked;
}

function renderCreate() {
  return render(<CustomerForm mode="create" />, { wrapper: MemoryRouter });
}

function renderEdit(id: string) {
  return render(
    <Routes>
      <Route path="/customers/:id/edit" element={<CustomerForm mode="edit" />} />
    </Routes>,
    { wrapper: ({ children }) => <MemoryRouter initialEntries={[`/customers/${id}/edit`]}>{children}</MemoryRouter> }
  );
}

describe('CustomerForm classification', () => {
  it('defaults a new customer to Individual', () => {
    mockStore();
    renderCreate();
    expect(screen.getByLabelText('Customer Type')).toHaveValue('Individual');
  });

  it('hides Company Name and Tax/VAT ID when Individual is selected, and does not require them to save', async () => {
    mockStore();
    renderCreate();

    expect(screen.queryByLabelText('Company Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tax/VAT ID')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Customer Name'), 'Jane Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');

    expect(screen.getByRole('button', { name: 'Create Customer' })).toBeEnabled();
  });

  it('shows and requires Company Name and Tax/VAT ID when Business is selected', async () => {
    mockStore();
    renderCreate();

    await userEvent.selectOptions(screen.getByLabelText('Customer Type'), 'Business');

    expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Tax/VAT ID')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Customer Name'), 'Jane Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');

    // Company Name and Tax/VAT ID still blank — Business requires them.
    expect(screen.getByRole('button', { name: 'Create Customer' })).toBeDisabled();

    await userEvent.type(screen.getByLabelText('Company Name'), 'Acme Corp');
    await userEvent.type(screen.getByLabelText('Tax/VAT ID'), 'DE999888777');

    expect(screen.getByRole('button', { name: 'Create Customer' })).toBeEnabled();
  });

  it('loads an existing Business customer with the fields visible and populated', async () => {
    // fetchOne resolves; store.current is already set via mockStore for this test.
    mockStore({ current: businessCustomer, fetchOne: vi.fn().mockResolvedValue(undefined) });
    renderEdit('c1');

    expect(await screen.findByLabelText('Customer Type')).toHaveValue('Business');
    expect(screen.getByLabelText('Company Name')).toHaveValue('Acme GmbH');
    expect(screen.getByLabelText('Tax/VAT ID')).toHaveValue('DE123456789');
  });

  it('loads an existing Individual customer with the fields hidden', async () => {
    mockStore({ current: individualCustomer, fetchOne: vi.fn().mockResolvedValue(undefined) });
    renderEdit('c2');

    expect(await screen.findByLabelText('Customer Type')).toHaveValue('Individual');
    expect(screen.queryByLabelText('Company Name')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Tax/VAT ID')).not.toBeInTheDocument();
  });

  it('preserves a typed Company Name across a Business -> Individual -> Business toggle', async () => {
    mockStore();
    renderCreate();

    await userEvent.selectOptions(screen.getByLabelText('Customer Type'), 'Business');
    await userEvent.type(screen.getByLabelText('Company Name'), 'Acme Corp');

    await userEvent.selectOptions(screen.getByLabelText('Customer Type'), 'Individual');
    expect(screen.queryByLabelText('Company Name')).not.toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Customer Type'), 'Business');
    expect(screen.getByLabelText('Company Name')).toHaveValue('Acme Corp');
  });

  // These two tests declare the spy and pass it in as an override, then assert on the spy
  // directly, rather than capturing mockStore()'s return value and asserting on e.g.
  // `store.update`. That's deliberate, not stylistic: `CustomersStoreShape` (ReturnType<typeof
  // useCustomersStore>) resolves to `unknown`, because Zustand's hook has an overloaded call
  // signature and TS's ReturnType<> picks the last overload (the generic selector one) rather
  // than the plain no-argument one — with no call-site argument to infer from, that collapses to
  // `unknown`, and no return-type annotation on mockStore() can fix it. The spy IS the exact
  // function wired into the store as update/create, so asserting on it directly is equivalent —
  // no coverage lost, just sidestepping a compiler trap that would otherwise silently type-check
  // `store.update` as `unknown` (TS18046) and fail the build.
  it('always includes customerType explicitly in the update payload, even when unchanged', async () => {
    const updateSpy = vi.fn().mockResolvedValue({ id: 'c1' });
    mockStore({
      current: businessCustomer,
      fetchOne: vi.fn().mockResolvedValue(undefined),
      update: updateSpy,
    });
    renderEdit('c1');

    await screen.findByLabelText('Customer Type');
    await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(updateSpy).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ customerType: 'Business' })
    );
  });

  it('includes customerType explicitly in the create payload', async () => {
    const createSpy = vi.fn().mockResolvedValue({ id: 'new-id' });
    mockStore({ create: createSpy });
    renderCreate();

    await userEvent.type(screen.getByLabelText('Customer Name'), 'Jane Doe');
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Create Customer' }));

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerType: 'Individual' })
    );
  });
});

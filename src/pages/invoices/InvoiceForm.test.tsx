import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InvoiceForm from './InvoiceForm';
import { useInvoicesStore } from '../../store/invoicesStore';
import { useCustomersStore } from '../../store/customersStore';
import { useSendersStore } from '../../store/sendersStore';
import type { Customer } from '../../types/customer';

vi.mock('../../store/invoicesStore', () => ({
  useInvoicesStore: vi.fn(),
}));
vi.mock('../../store/customersStore', () => ({
  useCustomersStore: vi.fn(),
}));
vi.mock('../../store/sendersStore', () => ({
  useSendersStore: vi.fn(),
}));

function mockInvoicesStore() {
  vi.mocked(useInvoicesStore).mockReturnValue({
    current: undefined,
    loading: false,
    fetchOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as ReturnType<typeof useInvoicesStore>);
}

function mockCustomersStore(list: Customer[]) {
  vi.mocked(useCustomersStore).mockReturnValue({
    list,
    limit: 100,
    setPage: vi.fn(),
    fetch: vi.fn(),
  } as unknown as ReturnType<typeof useCustomersStore>);
}

function mockSendersStore() {
  vi.mocked(useSendersStore).mockReturnValue({
    list: [],
    limit: 100,
    setPage: vi.fn(),
    fetch: vi.fn(),
  } as unknown as ReturnType<typeof useSendersStore>);
}

const withCompanyName: Customer = {
  id: 'c1',
  companyName: 'Acme GmbH',
  customerName: 'Erika Musterfrau',
  customerAddress: 'Musterstrasse 1',
  postalCode: '10115',
  customerEmail: 'erika@acme.example',
  customerTaxVatId: 'DE123456789',
  customerType: 'Business',
  documentLanguage: 'Estonian',
};

describe('InvoiceForm customer picker', () => {
  it('labels a customer with a company name as "{companyName} — {customerName}"', () => {
    mockInvoicesStore();
    mockCustomersStore([withCompanyName]);
    mockSendersStore();
    render(<InvoiceForm mode="create" />, { wrapper: MemoryRouter });
    expect(screen.getByRole('option', { name: 'Acme GmbH — Erika Musterfrau' })).toBeInTheDocument();
  });

  it('labels a customer with no company name by just their customer name, no leading dash', () => {
    mockInvoicesStore();
    mockCustomersStore([{ ...withCompanyName, companyName: '' }]);
    mockSendersStore();
    render(<InvoiceForm mode="create" />, { wrapper: MemoryRouter });
    expect(screen.getByRole('option', { name: 'Erika Musterfrau' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '— Erika Musterfrau' })).not.toBeInTheDocument();
  });
});

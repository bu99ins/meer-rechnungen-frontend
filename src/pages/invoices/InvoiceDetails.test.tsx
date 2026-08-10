import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InvoiceDetails from './InvoiceDetails';
import { useInvoicesStore } from '../../store/invoicesStore';
import type { InvoiceDetail } from '../../types/invoice';

vi.mock('../../store/invoicesStore', () => ({
  useInvoicesStore: vi.fn(),
}));

const baseInvoice: InvoiceDetail = {
  id: 'inv1',
  invoiceNumber: 'INV-001',
  invoiceDate: '2026-07-01',
  dueDate: '2026-07-15',
  currency: 'EUR',
  customer: {
    id: 'c1',
    companyName: 'Acme GmbH',
    customerName: 'Erika Musterfrau',
    customerAddress: 'Musterstrasse 1',
    postalCode: '10115',
    customerEmail: 'erika@acme.example',
    customerTaxVatId: 'DE123456789',
  },
  sender: {
    id: 's1',
    senderCompanyName: 'Meer von Rechnungen OU',
    senderFullName: 'Yury Krasavin',
    senderAddress: 'Tallinn, Estonia',
    senderTaxVatId: 'EE987654321',
    bankDetails: 'IBAN EE38',
  },
  lineItems: [],
  subtotal: 100,
  taxRate: 0.2,
  totalAmount: 120,
};

function mockStore(current: InvoiceDetail) {
  vi.mocked(useInvoicesStore).mockReturnValue({
    current,
    fetchOne: vi.fn(),
    loading: false,
    download: vi.fn(),
  } as unknown as ReturnType<typeof useInvoicesStore>);
}

describe('InvoiceDetails', () => {
  it('shows the customer company name in the Company row when present', () => {
    mockStore(baseInvoice);
    render(<InvoiceDetails />, { wrapper: MemoryRouter });
    expect(screen.getByText('Acme GmbH')).toBeInTheDocument();
  });

  it('falls back to the customer name in the Company row when companyName is empty', () => {
    mockStore({ ...baseInvoice, customer: { ...baseInvoice.customer, companyName: '' } });
    render(<InvoiceDetails />, { wrapper: MemoryRouter });
    expect(screen.queryByText('Acme GmbH')).not.toBeInTheDocument();
    // "Erika Musterfrau" now appears for both the Company row (fallback) and the Contact row.
    expect(screen.getAllByText('Erika Musterfrau')).toHaveLength(2);
  });
});

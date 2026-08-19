import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from './App';
import { useAuthStore } from './store/authStore';
import { useInvoicesStore } from './store/invoicesStore';
import { useCustomersStore } from './store/customersStore';
import { useSendersStore } from './store/sendersStore';
import * as invoicesService from './services/invoices';
import * as customersService from './services/customers';
import * as sendersService from './services/senders';
import type { InvoiceDetail } from './types/invoice';

// Regression coverage for the mounted-instance leak: /invoices/:id/edit and /invoices/new render
// the same InvoiceForm component type at the same position in the route tree, so a plain
// client-side navigation between them (e.g. via the header's "New Invoice" link, not a full page
// load) let React Router reuse the mounted instance instead of remounting it — the edited
// invoice's field values, including a non-EUR currency, stayed on screen in what claims to be a
// blank "New Invoice" form. Covers InvoiceForm; CustomerForm and SenderForm share the identical
// route shape and fix, but are not re-tested here — this is a routing-mechanism regression, not
// an entity-specific one.
vi.mock('./services/invoices');
vi.mock('./services/customers');
vi.mock('./services/senders');

const invoice: InvoiceDetail = {
  id: 'i1',
  invoiceNumber: 'INV-2024-001',
  invoiceDate: '2024-01-15',
  dueDate: '2024-02-15',
  currency: 'USD',
  notes: 'Thanks for your business',
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
    senderCompanyName: 'Contoso Ltd',
    senderFullName: 'Max Mustermann',
    senderAddress: 'Beispielweg 2',
    senderTaxVatId: 'DE987654321',
    bankDetails: 'IBAN DE11 1111 1111 1111 1111 11',
  },
  lineItems: [{ id: 'li1', itemName: 'Consulting', quantity: 2, unitPrice: 100, total: 200 }],
  subtotal: 200,
  taxRate: 0.19,
  totalAmount: 238,
};

afterEach(() => {
  useAuthStore.setState({ identity: null, sessionEndedReason: null, loading: false, error: undefined });
  useInvoicesStore.setState({ current: undefined, loading: false, error: undefined, list: [], total: 0, offset: 0, limit: 10 });
  useCustomersStore.setState({ current: undefined, loading: false, error: undefined, list: [], total: 0, offset: 0, limit: 10 });
  useSendersStore.setState({ current: undefined, loading: false, error: undefined, list: [], total: 0, offset: 0, limit: 10 });
  vi.clearAllMocks();
});

describe('client-side navigation between sibling form routes', () => {
  it('remounts InvoiceForm with a clean state when navigating from edit to new via the nav link, not the leaked edit-mode values', async () => {
    useAuthStore.setState({ identity: { id: 'u1', email: 'admin@test.com', role: 'Admin' }, sessionEndedReason: null, loading: false, error: undefined });
    vi.mocked(invoicesService.getInvoice).mockResolvedValue(invoice);
    vi.mocked(customersService.getCustomers).mockResolvedValue({ items: [], total: 0, offset: 0, limit: 100 });
    vi.mocked(sendersService.getSenders).mockResolvedValue({ items: [], total: 0, offset: 0, limit: 100 });
    vi.mocked(invoicesService.getInvoices).mockResolvedValue({ items: [], total: 0, offset: 0, limit: 10 });

    render(
      <MemoryRouter initialEntries={['/invoices/i1/edit']}>
        <AppRoutes />
      </MemoryRouter>
    );

    // Sanity: the edit form really did load the stored non-EUR currency before we navigate away.
    expect(await screen.findByLabelText('Currency')).toHaveValue('USD');
    expect(screen.getByLabelText('Invoice Number')).toHaveValue('INV-2024-001');

    await userEvent.click(screen.getByRole('link', { name: 'New Invoice' }));

    expect(await screen.findByRole('heading', { name: 'New Invoice' })).toBeInTheDocument();
    expect(screen.getByLabelText('Currency')).toHaveValue('EUR');
    expect(screen.getByLabelText('Invoice Number')).toHaveValue('');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InvoicesList from './InvoicesList';
import { useInvoicesStore } from '../../store/invoicesStore';
import { setViewportWidth } from '../../test-setup';
import type { InvoiceListItem } from '../../types/invoice';

vi.mock('../../store/invoicesStore', () => ({
  useInvoicesStore: vi.fn(),
}));

const invoice: InvoiceListItem = {
  id: 'inv1',
  invoiceNumber: 'DM00001',
  invoiceDate: '2026-07-18',
  dueDate: '2026-07-25',
  currency: 'EUR',
  totalAmount: 120,
};

function mockStore(list: InvoiceListItem[], overrides: Partial<ReturnType<typeof useInvoicesStore>> = {}) {
  vi.mocked(useInvoicesStore).mockReturnValue({
    list,
    total: list.length,
    offset: 0,
    limit: 10,
    loading: false,
    error: undefined,
    fetch: vi.fn(),
    setPage: vi.fn(),
    remove: vi.fn(),
    download: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useInvoicesStore>);
}

function renderList() {
  return render(
    <Routes>
      <Route path="/invoices" element={<InvoicesList />} />
      <Route path="/invoices/:id" element={<div>Invoice detail page</div>} />
      <Route path="/invoices/:id/edit" element={<div>Invoice edit page</div>} />
      <Route path="/invoices/new" element={<div>New invoice page</div>} />
    </Routes>,
    { wrapper: ({ children }) => <MemoryRouter initialEntries={['/invoices']}>{children}</MemoryRouter> }
  );
}

describe('InvoicesList at wide widths (table)', () => {
  it('renders the table with a View action, not cards', () => {
    mockStore([invoice]);
    renderList();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByTitle('View')).toBeInTheDocument();
  });

  it('navigates to the detail page on double-click but not on single click', async () => {
    mockStore([invoice]);
    renderList();
    const row = screen.getByText('DM00001').closest('tr')!;
    await userEvent.click(row);
    expect(screen.queryByText('Invoice detail page')).not.toBeInTheDocument();
    await userEvent.dblClick(row);
    expect(screen.getByText('Invoice detail page')).toBeInTheDocument();
  });

  it('does not navigate when double-clicking an action control', async () => {
    mockStore([invoice]);
    renderList();
    const deleteBtn = screen.getByTitle('Delete');
    await userEvent.dblClick(deleteBtn);
    expect(screen.queryByText('Invoice detail page')).not.toBeInTheDocument();
    expect(screen.getByText('Delete invoice?')).toBeInTheDocument();
  });
});

describe('InvoicesList at narrow widths (cards)', () => {
  it('renders cards with every field labeled, and Edit/Download/Delete but no View', () => {
    mockStore([invoice]);
    renderList();
    act(() => setViewportWidth(375));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('DM00001')).toBeInTheDocument();
    expect(screen.getByText('Invoice Date')).toBeInTheDocument();
    expect(screen.getByText('Due Date')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
    expect(screen.getByTitle('Download PDF')).toBeInTheDocument();
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
    expect(screen.queryByTitle('View')).not.toBeInTheDocument();
  });

  it('navigates to the detail page on a single click of the card body', async () => {
    mockStore([invoice]);
    renderList();
    act(() => setViewportWidth(375));
    const card = screen.getByText('DM00001').closest('[data-testid="invoice-card"]')!;
    await userEvent.click(card);
    expect(screen.getByText('Invoice detail page')).toBeInTheDocument();
  });

  it('does not navigate to the detail page when tapping Edit', async () => {
    mockStore([invoice]);
    renderList();
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByText('Invoice edit page')).toBeInTheDocument();
    expect(screen.queryByText('Invoice detail page')).not.toBeInTheDocument();
  });

  it('does not navigate to the detail page when tapping Download PDF', async () => {
    const download = vi.fn();
    mockStore([invoice], { download });
    renderList();
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByTitle('Download PDF'));
    expect(download).toHaveBeenCalledWith('inv1');
    expect(screen.queryByText('Invoice detail page')).not.toBeInTheDocument();
  });

  it('opens the confirm dialog on Delete tap and does not navigate', async () => {
    mockStore([invoice]);
    renderList();
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByTitle('Delete'));
    expect(screen.queryByText('Invoice detail page')).not.toBeInTheDocument();
    const dialog = screen.getByText('Delete invoice?').closest('div')!;
    expect(within(dialog.parentElement!).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('is reachable by keyboard via a real link on the card', () => {
    mockStore([invoice]);
    renderList();
    act(() => setViewportWidth(375));
    const link = screen.getByRole('link', { name: /DM00001/ });
    expect(link).toHaveAttribute('href', '/invoices/inv1');
  });
});

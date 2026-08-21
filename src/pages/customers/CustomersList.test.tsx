import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CustomersList from './CustomersList';
import { useCustomersStore } from '../../store/customersStore';
import { setViewportWidth } from '../../test-setup';
import type { Customer } from '../../types/customer';

vi.mock('../../store/customersStore', () => ({
  useCustomersStore: vi.fn(),
}));

const baseCustomer: Customer = {
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

function mockStore(list: Customer[], overrides: Partial<ReturnType<typeof useCustomersStore>> = {}) {
  vi.mocked(useCustomersStore).mockReturnValue({
    list,
    total: list.length,
    offset: 0,
    limit: 10,
    loading: false,
    error: undefined,
    fetch: vi.fn(),
    setPage: vi.fn(),
    remove: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useCustomersStore>);
}

function renderList() {
  return render(
    <Routes>
      <Route path="/customers" element={<CustomersList />} />
      <Route path="/customers/:id" element={<div>Customer detail page</div>} />
      <Route path="/customers/:id/edit" element={<div>Customer edit page</div>} />
    </Routes>,
    { wrapper: ({ children }) => <MemoryRouter initialEntries={['/customers']}>{children}</MemoryRouter> }
  );
}

describe('CustomersList', () => {
  it('shows the company name for a customer that has one', () => {
    mockStore([baseCustomer]);
    renderList();
    expect(screen.getByText('Acme GmbH')).toBeInTheDocument();
  });

  it('falls back to the customer name when companyName is empty', () => {
    mockStore([{ ...baseCustomer, companyName: '' }]);
    renderList();
    expect(screen.queryByText('Acme GmbH')).not.toBeInTheDocument();
    // The customer name now appears twice: once as the fallback "Company" cell, once as "Contact".
    expect(screen.getAllByText('Erika Musterfrau')).toHaveLength(2);
  });
});

describe('CustomersList at wide widths (table)', () => {
  it('renders the table with a View action, not cards', () => {
    mockStore([baseCustomer]);
    renderList();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByTitle('View')).toBeInTheDocument();
  });

  it('navigates to the detail page on double-click but not on single click', async () => {
    mockStore([baseCustomer]);
    renderList();
    const row = screen.getByText('Acme GmbH').closest('tr')!;
    await userEvent.click(row);
    expect(screen.queryByText('Customer detail page')).not.toBeInTheDocument();
    await userEvent.dblClick(row);
    expect(screen.getByText('Customer detail page')).toBeInTheDocument();
  });
});

describe('CustomersList at narrow widths (cards)', () => {
  it('renders cards with Contact and Email labeled, and Edit/Delete but no View', () => {
    mockStore([baseCustomer]);
    renderList();
    act(() => setViewportWidth(375));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Acme GmbH')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Erika Musterfrau')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('erika@acme.example')).toBeInTheDocument();
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
    expect(screen.queryByTitle('View')).not.toBeInTheDocument();
  });

  it('navigates to the detail page on a single click of the card body', async () => {
    mockStore([baseCustomer]);
    renderList();
    act(() => setViewportWidth(375));
    const card = screen.getByText('Acme GmbH').closest('[data-testid="customer-card"]')!;
    await userEvent.click(card);
    expect(screen.getByText('Customer detail page')).toBeInTheDocument();
  });

  it('does not navigate when tapping Edit', async () => {
    mockStore([baseCustomer]);
    renderList();
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByText('Customer edit page')).toBeInTheDocument();
    expect(screen.queryByText('Customer detail page')).not.toBeInTheDocument();
  });

  it('opens the confirm dialog on Delete tap and does not navigate', async () => {
    mockStore([baseCustomer]);
    renderList();
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByTitle('Delete'));
    expect(screen.queryByText('Customer detail page')).not.toBeInTheDocument();
    expect(screen.getByText('Delete customer?')).toBeInTheDocument();
  });

  it('is reachable by keyboard via a real link on the card', () => {
    mockStore([baseCustomer]);
    renderList();
    act(() => setViewportWidth(375));
    const link = screen.getByRole('link', { name: /Acme GmbH/ });
    expect(link).toHaveAttribute('href', '/customers/c1');
  });
});

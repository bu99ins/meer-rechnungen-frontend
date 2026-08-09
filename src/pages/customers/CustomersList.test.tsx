import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CustomersList from './CustomersList';
import { useCustomersStore } from '../../store/customersStore';
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
};

function mockStore(list: Customer[]) {
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
  } as unknown as ReturnType<typeof useCustomersStore>);
}

describe('CustomersList', () => {
  it('shows the company name for a customer that has one', () => {
    mockStore([baseCustomer]);
    render(<CustomersList />, { wrapper: MemoryRouter });
    expect(screen.getByText('Acme GmbH')).toBeInTheDocument();
  });

  it('falls back to the customer name when companyName is empty', () => {
    mockStore([{ ...baseCustomer, companyName: '' }]);
    render(<CustomersList />, { wrapper: MemoryRouter });
    expect(screen.queryByText('Acme GmbH')).not.toBeInTheDocument();
    // The customer name now appears twice: once as the fallback "Company" cell, once as "Contact".
    expect(screen.getAllByText('Erika Musterfrau')).toHaveLength(2);
  });
});

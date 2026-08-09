import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CustomerDetails from './CustomerDetails';
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

function mockStore(current: Customer) {
  vi.mocked(useCustomersStore).mockReturnValue({
    current,
    fetchOne: vi.fn(),
    loading: false,
  } as unknown as ReturnType<typeof useCustomersStore>);
}

describe('CustomerDetails', () => {
  it('shows the company name as the heading for a customer that has one', () => {
    mockStore(baseCustomer);
    render(<CustomerDetails />, { wrapper: MemoryRouter });
    expect(screen.getByRole('heading', { name: 'Acme GmbH' })).toBeInTheDocument();
  });

  it('falls back to the customer name as the heading when companyName is empty', () => {
    mockStore({ ...baseCustomer, companyName: '' });
    render(<CustomerDetails />, { wrapper: MemoryRouter });
    expect(screen.getByRole('heading', { name: 'Erika Musterfrau' })).toBeInTheDocument();
  });
});

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

  it('shows Address and Postal Code rows when both are present', () => {
    mockStore(baseCustomer);
    render(<CustomerDetails />, { wrapper: MemoryRouter });
    expect(screen.getByText('Address')).toBeInTheDocument();
    expect(screen.getByText('Musterstrasse 1')).toBeInTheDocument();
    expect(screen.getByText('Postal Code')).toBeInTheDocument();
    expect(screen.getByText('10115')).toBeInTheDocument();
  });

  it('omits the Address and Postal Code rows entirely when both are blank', () => {
    mockStore({ ...baseCustomer, customerAddress: '', postalCode: '' });
    render(<CustomerDetails />, { wrapper: MemoryRouter });
    expect(screen.queryByText('Address')).not.toBeInTheDocument();
    expect(screen.queryByText('Postal Code')).not.toBeInTheDocument();
  });

  it('omits only the blank one when just one of Address/Postal Code is set', () => {
    mockStore({ ...baseCustomer, customerAddress: '   ', postalCode: '10115' });
    render(<CustomerDetails />, { wrapper: MemoryRouter });
    expect(screen.queryByText('Address')).not.toBeInTheDocument();
    expect(screen.getByText('Postal Code')).toBeInTheDocument();
  });

  it('omits the Address and Postal Code rows when the backend returns null (absence canonicalized)', () => {
    mockStore({ ...baseCustomer, customerAddress: null, postalCode: null });
    render(<CustomerDetails />, { wrapper: MemoryRouter });
    expect(screen.queryByText('Address')).not.toBeInTheDocument();
    expect(screen.queryByText('Postal Code')).not.toBeInTheDocument();
  });
});

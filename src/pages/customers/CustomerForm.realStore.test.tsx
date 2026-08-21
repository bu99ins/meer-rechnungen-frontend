import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CustomerForm from './CustomerForm';
import { useCustomersStore } from '../../store/customersStore';
import * as customersService from '../../services/customers';
import type { Customer } from '../../types/customer';

// Deliberately does NOT mock '../../store/customersStore' — only the service layer underneath it.
// CustomerForm.test.tsx mocks the whole store and pre-seeds `current` in the mock's initial return
// value, which cannot exercise the real fetch-then-populate path: Zustand's `set()` replaces the
// state object rather than mutating it, so a stale closure over the store captured before a fetch
// resolves would still read the pre-fetch snapshot — a real bug this test is built to catch.
vi.mock('../../services/customers');

const businessCustomer: Customer = {
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

function renderEdit(id: string) {
	return render(
		<Routes>
			<Route path="/customers/:id/edit" element={<CustomerForm mode="edit" />} />
			{/* Stub target of the post-save navigate() call, so React Router doesn't warn about an
			    unmatched location when a save-triggering test runs to completion. */}
			<Route path="/customers/:id" element={<div />} />
		</Routes>,
		{ wrapper: ({ children }) => <MemoryRouter initialEntries={[`/customers/${id}/edit`]}>{children}</MemoryRouter> }
	);
}

afterEach(() => {
	// The real store is a module-level singleton; reset it between tests so one test's fetched
	// customer (or list/pagination state left over from store.update's internal re-fetch) doesn't
	// leak into the next.
	useCustomersStore.setState({ current: undefined, loading: false, error: undefined, list: [], total: 0, offset: 0, limit: 10 });
});

describe('CustomerForm edit-mode load, against the real store', () => {
	it('populates the classification and Business fields from the customer the store actually fetched', async () => {
		vi.mocked(customersService.getCustomer).mockResolvedValue(businessCustomer);

		renderEdit('c1');

		expect(await screen.findByLabelText('Customer Type')).toHaveValue('Business');
		expect(screen.getByLabelText('Company Name')).toHaveValue('Acme GmbH');
		expect(screen.getByLabelText('Tax/VAT ID')).toHaveValue('DE123456789');
		expect(screen.getByLabelText('Customer Name')).toHaveValue('Erika Musterfrau');
	});

	it('sends the loaded customer\'s own classification back on save, unchanged', async () => {
		vi.mocked(customersService.getCustomer).mockResolvedValue(businessCustomer);
		vi.mocked(customersService.updateCustomer).mockResolvedValue(businessCustomer);
		// store.update() re-fetches the list internally after a successful save; stub it explicitly
		// rather than relying on the store's own try/catch to swallow an unmocked-call rejection.
		vi.mocked(customersService.getCustomers).mockResolvedValue({ items: [businessCustomer], total: 1, offset: 0, limit: 10 });

		renderEdit('c1');

		await screen.findByLabelText('Customer Type');
		// Sanity: the field really did load Business data before we save it back.
		expect(screen.getByLabelText('Company Name')).toHaveValue('Acme GmbH');

		await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

		expect(customersService.updateCustomer).toHaveBeenCalledWith(
			'c1',
			expect.objectContaining({
				customerType: 'Business',
				documentLanguage: 'Estonian',
				companyName: 'Acme GmbH',
				customerTaxVatId: 'DE123456789',
			})
		);
	});
});

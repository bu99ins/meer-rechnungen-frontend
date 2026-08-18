import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InvoiceForm from './InvoiceForm';
import { useInvoicesStore } from '../../store/invoicesStore';
import { useCustomersStore } from '../../store/customersStore';
import { useSendersStore } from '../../store/sendersStore';
import * as invoicesService from '../../services/invoices';
import * as customersService from '../../services/customers';
import * as sendersService from '../../services/senders';
import type { InvoiceDetail } from '../../types/invoice';
import type { Customer } from '../../types/customer';
import type { Sender } from '../../types/sender';

// Deliberately does NOT mock '../../store/invoicesStore' — only the service layer underneath it.
// A mocked store with `current` pre-seeded in its initial return value can't exercise the real
// fetch-then-populate path: Zustand's `set()` replaces the state object rather than mutating it,
// so a stale closure over the store captured before a fetch resolves would still read the
// pre-fetch snapshot — a real bug this test is built to catch.
vi.mock('../../services/invoices');
vi.mock('../../services/customers');
vi.mock('../../services/senders');

const customer: Customer = {
	id: 'c1',
	companyName: 'Acme GmbH',
	customerName: 'Erika Musterfrau',
	customerAddress: 'Musterstrasse 1',
	postalCode: '10115',
	customerEmail: 'erika@acme.example',
	customerTaxVatId: 'DE123456789',
	customerType: 'Business',
};

const sender: Sender = {
	id: 's1',
	senderCompanyName: 'Contoso Ltd',
	senderFullName: 'Max Mustermann',
	senderAddress: 'Beispielweg 2',
	senderTaxVatId: 'DE987654321',
	bankDetails: 'IBAN DE11 1111 1111 1111 1111 11',
	senderPhone: '',
	senderEmail: '',
};

const invoice: InvoiceDetail = {
	id: 'i1',
	invoiceNumber: 'INV-2024-001',
	invoiceDate: '2024-01-15',
	dueDate: '2024-02-15',
	currency: 'EUR',
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

function renderEdit(id: string) {
	return render(
		<Routes>
			<Route path="/invoices/:id/edit" element={<InvoiceForm mode="edit" />} />
			{/* Stub target of the post-save navigate() call, so React Router doesn't warn about an
			    unmatched location when a save-triggering test runs to completion. */}
			<Route path="/invoices/:id" element={<div />} />
		</Routes>,
		{ wrapper: ({ children }) => <MemoryRouter initialEntries={[`/invoices/${id}/edit`]}>{children}</MemoryRouter> }
	);
}

afterEach(() => {
	// These are module-level singletons; reset them between tests so one test's fetched data
	// (or list/pagination state left over from an internal re-fetch) doesn't leak into the next.
	useInvoicesStore.setState({ current: undefined, loading: false, error: undefined, list: [], total: 0, offset: 0, limit: 10 });
	useCustomersStore.setState({ current: undefined, loading: false, error: undefined, list: [], total: 0, offset: 0, limit: 10 });
	useSendersStore.setState({ current: undefined, loading: false, error: undefined, list: [], total: 0, offset: 0, limit: 10 });
});

describe('InvoiceForm edit-mode load, against the real store', () => {
	it('populates the fields from the invoice the store actually fetched', async () => {
		vi.mocked(invoicesService.getInvoice).mockResolvedValue(invoice);
		vi.mocked(customersService.getCustomers).mockResolvedValue({ items: [customer], total: 1, offset: 0, limit: 100 });
		vi.mocked(sendersService.getSenders).mockResolvedValue({ items: [sender], total: 1, offset: 0, limit: 100 });

		renderEdit('i1');

		expect(await screen.findByLabelText('Invoice Number')).toHaveValue('INV-2024-001');
		expect(screen.getByLabelText('Currency')).toHaveValue('EUR');
		expect(screen.getByLabelText('Customer')).toHaveValue('c1');
		expect(screen.getByLabelText('Sender')).toHaveValue('s1');
		expect(screen.getByLabelText('Tax Rate (%)')).toHaveValue(19);
	});

	it("sends the loaded invoice's own data back on save, unchanged", async () => {
		vi.mocked(invoicesService.getInvoice).mockResolvedValue(invoice);
		vi.mocked(customersService.getCustomers).mockResolvedValue({ items: [customer], total: 1, offset: 0, limit: 100 });
		vi.mocked(sendersService.getSenders).mockResolvedValue({ items: [sender], total: 1, offset: 0, limit: 100 });
		vi.mocked(invoicesService.updateInvoice).mockResolvedValue(invoice);
		// store.update() re-fetches the list internally after a successful save; stub it explicitly
		// rather than relying on the store's own try/catch to swallow an unmocked-call rejection.
		vi.mocked(invoicesService.getInvoices).mockResolvedValue({ items: [{ id: 'i1', invoiceNumber: 'INV-2024-001', invoiceDate: invoice.invoiceDate, dueDate: invoice.dueDate, currency: 'EUR', totalAmount: 238 }], total: 1, offset: 0, limit: 10 });

		renderEdit('i1');

		await screen.findByLabelText('Invoice Number');
		// Sanity: the field really did load the fetched data before we save it back.
		expect(screen.getByLabelText('Customer')).toHaveValue('c1');

		await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

		// Dates are asserted explicitly here (not just left to objectContaining's other keys) because
		// this is the regression case for the date round-trip: loading a fetched date into the <input
		// type="date"> field and saving it back must reproduce the exact same "yyyy-MM-dd" string,
		// with no drift introduced by the load/save path.
		expect(invoicesService.updateInvoice).toHaveBeenCalledWith(
			'i1',
			expect.objectContaining({
				invoiceNumber: 'INV-2024-001',
				invoiceDate: '2024-01-15',
				dueDate: '2024-02-15',
				customerId: 'c1',
				senderId: 's1',
			})
		);
	});
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SenderForm from './SenderForm';
import { useSendersStore } from '../../store/sendersStore';
import * as sendersService from '../../services/senders';
import type { Sender } from '../../types/sender';

// Deliberately does NOT mock '../../store/sendersStore' — only the service layer underneath it.
// A mocked store with `current` pre-seeded in its initial return value can't exercise the real
// fetch-then-populate path: Zustand's `set()` replaces the state object rather than mutating it,
// so a stale closure over the store captured before a fetch resolves would still read the
// pre-fetch snapshot — a real bug this test is built to catch.
vi.mock('../../services/senders');

const sender: Sender = {
	id: 's1',
	senderCompanyName: 'Acme GmbH',
	senderFullName: 'Erika Musterfrau',
	senderAddress: 'Musterstrasse 1',
	senderTaxVatId: 'DE123456789',
	bankDetails: 'IBAN DE00 0000 0000 0000 0000 00',
	senderPhone: '',
	senderEmail: '',
};

function renderEdit(id: string) {
	return render(
		<Routes>
			<Route path="/senders/:id/edit" element={<SenderForm mode="edit" />} />
			{/* Stub target of the post-save navigate() call, so React Router doesn't warn about an
			    unmatched location when a save-triggering test runs to completion. */}
			<Route path="/senders/:id" element={<div />} />
		</Routes>,
		{ wrapper: ({ children }) => <MemoryRouter initialEntries={[`/senders/${id}/edit`]}>{children}</MemoryRouter> }
	);
}

afterEach(() => {
	// The real store is a module-level singleton; reset it between tests so one test's fetched
	// sender (or list/pagination state left over from store.update's internal re-fetch) doesn't
	// leak into the next.
	useSendersStore.setState({ current: undefined, loading: false, error: undefined, list: [], total: 0, offset: 0, limit: 10 });
});

describe('SenderForm edit-mode load, against the real store', () => {
	it('populates the fields from the sender the store actually fetched', async () => {
		vi.mocked(sendersService.getSender).mockResolvedValue(sender);

		renderEdit('s1');

		expect(await screen.findByLabelText('Company Name')).toHaveValue('Acme GmbH');
		expect(screen.getByLabelText('Full Name')).toHaveValue('Erika Musterfrau');
		expect(screen.getByLabelText('Tax/VAT ID')).toHaveValue('DE123456789');
		expect(screen.getByLabelText('Bank Details')).toHaveValue('IBAN DE00 0000 0000 0000 0000 00');
	});

	it("sends the loaded sender's own data back on save, unchanged", async () => {
		vi.mocked(sendersService.getSender).mockResolvedValue(sender);
		vi.mocked(sendersService.updateSender).mockResolvedValue(sender);
		// store.update() re-fetches the list internally after a successful save; stub it explicitly
		// rather than relying on the store's own try/catch to swallow an unmocked-call rejection.
		vi.mocked(sendersService.getSenders).mockResolvedValue({ items: [sender], total: 1, offset: 0, limit: 10 });

		renderEdit('s1');

		await screen.findByLabelText('Company Name');
		// Sanity: the field really did load the fetched data before we save it back.
		expect(screen.getByLabelText('Company Name')).toHaveValue('Acme GmbH');

		await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

		expect(sendersService.updateSender).toHaveBeenCalledWith(
			's1',
			expect.objectContaining({
				senderCompanyName: 'Acme GmbH',
				senderFullName: 'Erika Musterfrau',
				senderTaxVatId: 'DE123456789',
				bankDetails: 'IBAN DE00 0000 0000 0000 0000 00',
			})
		);
	});

	it('populates Phone and Email from the loaded sender, and persists edited values on save', async () => {
		vi.mocked(sendersService.getSender).mockResolvedValue({
			...sender,
			senderPhone: '+372 5555 5555',
			senderEmail: 'office@acme.example',
		});
		vi.mocked(sendersService.updateSender).mockResolvedValue(sender);
		vi.mocked(sendersService.getSenders).mockResolvedValue({ items: [sender], total: 1, offset: 0, limit: 10 });

		renderEdit('s1');

		expect(await screen.findByLabelText('Phone')).toHaveValue('+372 5555 5555');
		expect(screen.getByLabelText('Email')).toHaveValue('office@acme.example');

		await userEvent.clear(screen.getByLabelText('Phone'));
		await userEvent.type(screen.getByLabelText('Phone'), '+49 30 123456');
		await userEvent.clear(screen.getByLabelText('Email'));
		await userEvent.type(screen.getByLabelText('Email'), 'hello@acme.example');

		await userEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

		expect(sendersService.updateSender).toHaveBeenCalledWith(
			's1',
			expect.objectContaining({
				senderPhone: '+49 30 123456',
				senderEmail: 'hello@acme.example',
			})
		);
	});

	it('disables the save control while Address, Tax/VAT ID or Bank Details is blank', async () => {
		vi.mocked(sendersService.getSender).mockResolvedValue({
			...sender,
			senderAddress: '',
			senderTaxVatId: '',
			bankDetails: '',
		});

		renderEdit('s1');

		await screen.findByLabelText('Company Name');

		expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
	});
});

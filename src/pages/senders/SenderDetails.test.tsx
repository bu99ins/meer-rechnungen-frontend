import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SenderDetails from './SenderDetails';
import { useSendersStore } from '../../store/sendersStore';
import type { Sender } from '../../types/sender';

vi.mock('../../store/sendersStore', () => ({
	useSendersStore: vi.fn(),
}));

const baseSender: Sender = {
	id: 's1',
	senderCompanyName: 'Acme GmbH',
	senderFullName: 'Erika Musterfrau',
	senderAddress: 'Musterstrasse 1',
	senderTaxVatId: 'DE123456789',
	bankDetails: 'IBAN DE00 0000 0000 0000 0000 00',
	senderPhone: '+372 5555 5555',
	senderEmail: 'office@acme.example',
};

function mockStore(current: Sender) {
	vi.mocked(useSendersStore).mockReturnValue({
		current,
		fetchOne: vi.fn(),
		loading: false,
	} as unknown as ReturnType<typeof useSendersStore>);
}

describe('SenderDetails', () => {
	it('shows Phone and Email rows when both are present', () => {
		mockStore(baseSender);
		render(<SenderDetails />, { wrapper: MemoryRouter });

		expect(screen.getByText('Phone')).toBeInTheDocument();
		expect(screen.getByText('+372 5555 5555')).toBeInTheDocument();
		expect(screen.getByText('Email')).toBeInTheDocument();
		expect(screen.getByText('office@acme.example')).toBeInTheDocument();
	});

	it('omits the Phone and Email rows entirely when both are blank', () => {
		mockStore({ ...baseSender, senderPhone: '', senderEmail: '' });
		render(<SenderDetails />, { wrapper: MemoryRouter });

		expect(screen.queryByText('Phone')).not.toBeInTheDocument();
		expect(screen.queryByText('Email')).not.toBeInTheDocument();
	});

	it('omits only the blank one when just one of Phone/Email is set', () => {
		mockStore({ ...baseSender, senderPhone: '   ', senderEmail: 'office@acme.example' });
		render(<SenderDetails />, { wrapper: MemoryRouter });

		expect(screen.queryByText('Phone')).not.toBeInTheDocument();
		expect(screen.getByText('Email')).toBeInTheDocument();
	});
});

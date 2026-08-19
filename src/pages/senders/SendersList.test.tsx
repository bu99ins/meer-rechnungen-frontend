import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SendersList from './SendersList';
import { useSendersStore } from '../../store/sendersStore';
import { setViewportWidth } from '../../test-setup';
import type { Sender } from '../../types/sender';

vi.mock('../../store/sendersStore', () => ({
  useSendersStore: vi.fn(),
}));

const baseSender: Sender = {
  id: 's1',
  senderCompanyName: 'Deutsch und Meer',
  senderFullName: 'Yury Krasavin',
  senderAddress: 'Musterstrasse 1',
  senderTaxVatId: 'DE987654321',
  bankDetails: 'IBAN DE00 0000 0000 0000 00',
  senderPhone: null,
  senderEmail: null,
};

function mockStore(list: Sender[], overrides: Partial<ReturnType<typeof useSendersStore>> = {}) {
  vi.mocked(useSendersStore).mockReturnValue({
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
  } as unknown as ReturnType<typeof useSendersStore>);
}

function renderList() {
  return render(
    <Routes>
      <Route path="/senders" element={<SendersList />} />
      <Route path="/senders/:id" element={<div>Sender detail page</div>} />
      <Route path="/senders/:id/edit" element={<div>Sender edit page</div>} />
    </Routes>,
    { wrapper: ({ children }) => <MemoryRouter initialEntries={['/senders']}>{children}</MemoryRouter> }
  );
}

describe('SendersList at wide widths (table)', () => {
  it('renders the table with a View action, not cards', () => {
    mockStore([baseSender]);
    renderList();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByTitle('View')).toBeInTheDocument();
  });

  it('navigates to the detail page on double-click but not on single click', async () => {
    mockStore([baseSender]);
    renderList();
    const row = screen.getByText('Deutsch und Meer').closest('tr')!;
    await userEvent.click(row);
    expect(screen.queryByText('Sender detail page')).not.toBeInTheDocument();
    await userEvent.dblClick(row);
    expect(screen.getByText('Sender detail page')).toBeInTheDocument();
  });
});

describe('SendersList at narrow widths (cards)', () => {
  it('renders cards with Full Name and Tax/VAT labeled, and Edit/Delete but no View', () => {
    mockStore([baseSender]);
    renderList();
    act(() => setViewportWidth(375));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Deutsch und Meer')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Yury Krasavin')).toBeInTheDocument();
    expect(screen.getByText('Tax/VAT')).toBeInTheDocument();
    expect(screen.getByText('DE987654321')).toBeInTheDocument();
    expect(screen.getByTitle('Edit')).toBeInTheDocument();
    expect(screen.getByTitle('Delete')).toBeInTheDocument();
    expect(screen.queryByTitle('View')).not.toBeInTheDocument();
  });

  it('navigates to the detail page on a single click of the card body', async () => {
    mockStore([baseSender]);
    renderList();
    act(() => setViewportWidth(375));
    const card = screen.getByText('Deutsch und Meer').closest('[data-testid="sender-card"]')!;
    await userEvent.click(card);
    expect(screen.getByText('Sender detail page')).toBeInTheDocument();
  });

  it('does not navigate when tapping Edit', async () => {
    mockStore([baseSender]);
    renderList();
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByTitle('Edit'));
    expect(screen.getByText('Sender edit page')).toBeInTheDocument();
    expect(screen.queryByText('Sender detail page')).not.toBeInTheDocument();
  });

  it('opens the confirm dialog on Delete tap and does not navigate', async () => {
    mockStore([baseSender]);
    renderList();
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByTitle('Delete'));
    expect(screen.queryByText('Sender detail page')).not.toBeInTheDocument();
    expect(screen.getByText('Delete sender?')).toBeInTheDocument();
  });

  it('is reachable by keyboard via a real link on the card', () => {
    mockStore([baseSender]);
    renderList();
    act(() => setViewportWidth(375));
    const link = screen.getByRole('link', { name: /Deutsch und Meer/ });
    expect(link).toHaveAttribute('href', '/senders/s1');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import { useAuthStore } from '../store/authStore';
import { setViewportWidth } from '../test-setup';
import type { Identity } from '../types/user';

vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

function mockAuth(identity: Identity | null) {
  vi.mocked(useAuthStore).mockImplementation((selector) =>
    selector({ identity, logout: vi.fn() } as unknown as Parameters<typeof useAuthStore>[0] extends (s: infer S) => unknown ? S : never)
  );
}

const manager: Identity = { id: 'u1', email: 'manager@test.com', role: 'Manager' };
const admin: Identity = { id: 'u2', email: 'admin@test.com', role: 'Admin' };

describe('Layout header at wide widths', () => {
  it('renders the inline nav, email and Sign out, with no menu control', () => {
    mockAuth(manager);
    render(<Layout />, { wrapper: MemoryRouter });
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument();
    expect(screen.getByText('manager@test.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
  });
});

describe('Layout header at narrow widths', () => {
  it('shows only the brand and a menu control, no inline nav/email/Sign out', () => {
    mockAuth(manager);
    render(<Layout />, { wrapper: MemoryRouter });
    act(() => setViewportWidth(375));
    expect(screen.queryByRole('navigation', { name: /primary/i })).not.toBeInTheDocument();
    expect(screen.queryByText('manager@test.com')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('lists Invoices, Customers, Senders and New Invoice but not Users for a non-Admin', async () => {
    mockAuth(manager);
    render(<Layout />, { wrapper: MemoryRouter });
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByRole('button', { name: /menu/i }));
    const panel = screen.getByRole('dialog', { name: /menu/i });
    expect(within(panel).getByRole('link', { name: 'Invoices' })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Customers' })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Senders' })).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'New Invoice' })).toBeInTheDocument();
    expect(within(panel).queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
  });

  it('additionally lists Users for an Admin', async () => {
    mockAuth(admin);
    render(<Layout />, { wrapper: MemoryRouter });
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByRole('button', { name: /menu/i }));
    const panel = screen.getByRole('dialog', { name: /menu/i });
    expect(within(panel).getByRole('link', { name: 'Users' })).toBeInTheDocument();
  });

  it('carries the signed-in email and Sign out inside the panel', async () => {
    mockAuth(manager);
    render(<Layout />, { wrapper: MemoryRouter });
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByRole('button', { name: /menu/i }));
    const panel = screen.getByRole('dialog', { name: /menu/i });
    expect(within(panel).getByText('manager@test.com')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('can be closed without navigating', async () => {
    mockAuth(manager);
    render(<Layout />, { wrapper: MemoryRouter });
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(screen.getByRole('dialog', { name: /menu/i })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: /menu/i })).not.toBeInTheDocument();
  });

  it('closes the panel when a destination is chosen', async () => {
    mockAuth(manager);
    render(<Layout />, { wrapper: MemoryRouter });
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByRole('button', { name: /menu/i }));
    const panel = screen.getByRole('dialog', { name: /menu/i });
    await userEvent.click(within(panel).getByRole('link', { name: 'Customers' }));
    expect(screen.queryByRole('dialog', { name: /menu/i })).not.toBeInTheDocument();
  });

  it('closes the panel when choosing the destination already open', async () => {
    mockAuth(manager);
    render(
      <MemoryRouter initialEntries={['/invoices']}>
        <Layout />
      </MemoryRouter>
    );
    act(() => setViewportWidth(375));
    await userEvent.click(screen.getByRole('button', { name: /menu/i }));
    const panel = screen.getByRole('dialog', { name: /menu/i });
    await userEvent.click(within(panel).getByRole('link', { name: 'Invoices' }));
    expect(screen.queryByRole('dialog', { name: /menu/i })).not.toBeInTheDocument();
  });

  it('closes the panel via the toggle button while it is open', async () => {
    mockAuth(manager);
    render(<Layout />, { wrapper: MemoryRouter });
    act(() => setViewportWidth(375));
    const toggle = screen.getByRole('button', { name: /menu/i });
    await userEvent.click(toggle);
    expect(screen.getByRole('dialog', { name: /menu/i })).toBeInTheDocument();
    await userEvent.click(toggle);
    expect(screen.queryByRole('dialog', { name: /menu/i })).not.toBeInTheDocument();
  });
});

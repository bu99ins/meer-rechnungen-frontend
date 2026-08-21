import { describe, expect, it, vi } from 'vitest';
import type { AxiosInstance } from 'axios';
import { downloadInvoicePdf } from './invoices';
import { getApi } from '../lib/api';

vi.mock('../lib/api', () => ({
  getApi: vi.fn(),
}));

// Response.headers exposes an AxiosHeaders-like `.get()` in the browser (see the comment in
// invoices.ts) — this fake mirrors that shape rather than a plain object, so the test exercises
// the same code path the real axios client does.
function mockResponse(disposition: string | undefined) {
  const blob = new Blob(['%PDF-fake']);
  return {
    data: blob,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'content-disposition' ? disposition : undefined),
    },
  };
}

// A fake AxiosInstance carrying only the `get` method downloadInvoicePdf actually calls — cast
// through `unknown` rather than `any` (the codebase's real `getApi()` return type is the full
// AxiosInstance interface, which this fake deliberately doesn't implement in full).
function mockApi(disposition: string | undefined): AxiosInstance {
  return { get: vi.fn().mockResolvedValue(mockResponse(disposition)) } as unknown as AxiosInstance;
}

describe('downloadInvoicePdf filename extraction', () => {
  // spec invoice-document-localization.md, requirement 22: the extended RFC 5987 form
  // (filename*=UTF-8''...) must win even though ASP.NET Core's Results.File emits the ASCII
  // fallback (filename="...") first in the header — a single left-to-right regex alternation
  // would otherwise match the ASCII form and mangle any diacritics.
  it('prefers the UTF-8 extended filename over the ASCII fallback when both are present', async () => {
    const disposition =
      'attachment; filename="Invoice 2026-042 - M_ller Stra_e GmbH - 20260821.pdf"; ' +
      "filename*=UTF-8''Invoice%202026-042%20-%20M%C3%BCller%20Stra%C3%9Fe%20GmbH%20-%2020260821.pdf";
    vi.mocked(getApi).mockReturnValue(mockApi(disposition));

    const { filename } = await downloadInvoicePdf('id-1');

    expect(filename).toBe('Invoice 2026-042 - Müller Straße GmbH - 20260821.pdf');
  });

  it('falls back to the ASCII filename when no extended form is present', async () => {
    const disposition = 'attachment; filename="Invoice 2026-042 - Acme GmbH - 20260821.pdf"';
    vi.mocked(getApi).mockReturnValue(mockApi(disposition));

    const { filename } = await downloadInvoicePdf('id-2');

    expect(filename).toBe('Invoice 2026-042 - Acme GmbH - 20260821.pdf');
  });

  it('falls back to a generic name when no Content-Disposition header is present', async () => {
    vi.mocked(getApi).mockReturnValue(mockApi(undefined));

    const { filename } = await downloadInvoicePdf('id-3');

    expect(filename).toBe('invoice-id-3.pdf');
  });

  it('correctly decodes an Estonian invoice word and diacritics from the extended form', async () => {
    const disposition =
      "attachment; filename=\"Arve 2026-042 - Trans Ekspedit OU - 20260821.pdf\"; " +
      "filename*=UTF-8''Arve%202026-042%20-%20Trans%20Ekspedit%20O%C3%9C%20-%2020260821.pdf";
    vi.mocked(getApi).mockReturnValue(mockApi(disposition));

    const { filename } = await downloadInvoicePdf('id-4');

    expect(filename).toBe('Arve 2026-042 - Trans Ekspedit OÜ - 20260821.pdf');
  });

  // The extraction must not depend on which form the header lists first — only on preference,
  // per the comment in invoices.ts. Same content as the first test, header parameters reversed.
  it('prefers the UTF-8 extended filename even when it appears before the ASCII fallback in the header', async () => {
    const disposition =
      "attachment; filename*=UTF-8''Invoice%202026-042%20-%20M%C3%BCller%20Stra%C3%9Fe%20GmbH%20-%2020260821.pdf; " +
      'filename="Invoice 2026-042 - M_ller Stra_e GmbH - 20260821.pdf"';
    vi.mocked(getApi).mockReturnValue(mockApi(disposition));

    const { filename } = await downloadInvoicePdf('id-5');

    expect(filename).toBe('Invoice 2026-042 - Müller Straße GmbH - 20260821.pdf');
  });

  // Exercises the plain-object header access path (the second half of the `??` chain in
  // downloadInvoicePdf), not just AxiosHeaders' `.get()` — the two are read differently and both
  // need to work depending on how the browser exposes the response.
  it('reads the filename via plain property access when headers has no .get()', async () => {
    const blob = new Blob(['%PDF-fake']);
    const response = {
      data: blob,
      headers: {
        'content-disposition': 'attachment; filename="Invoice 2026-042 - Acme GmbH - 20260821.pdf"',
      },
    };
    vi.mocked(getApi).mockReturnValue({ get: vi.fn().mockResolvedValue(response) } as unknown as AxiosInstance);

    const { filename } = await downloadInvoicePdf('id-6');

    expect(filename).toBe('Invoice 2026-042 - Acme GmbH - 20260821.pdf');
  });
});

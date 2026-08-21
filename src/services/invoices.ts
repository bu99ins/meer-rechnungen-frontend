import { getApi } from '../lib/api';
import type { InvoiceListItem, InvoiceDetail, InvoiceUpsert, PagedInvoices } from '../types/invoice';

const base = '/api/invoices';

export async function getInvoices(offset = 0, limit = 10): Promise<PagedInvoices> {
  const api = getApi();
  const { data } = await api.get(`${base}?offset=${offset}&limit=${limit}`);
  // If backend returns array with total headers, adapt as needed.
  if (Array.isArray(data)) {
    return { items: data as InvoiceListItem[], total: data.length, offset, limit } as PagedInvoices;
  }
  return data as PagedInvoices;
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
  const api = getApi();
  const { data } = await api.get(`${base}/${id}`);
  return data as InvoiceDetail;
}

export async function createInvoice(payload: InvoiceUpsert): Promise<InvoiceDetail> {
  const api = getApi();
  const { data } = await api.post(base, payload);
  return data as InvoiceDetail;
}

export async function updateInvoice(id: string, payload: InvoiceUpsert): Promise<InvoiceDetail> {
  const api = getApi();
  const { data } = await api.put(`${base}/${id}`, payload);
  return data as InvoiceDetail;
}

export async function deleteInvoice(id: string): Promise<void> {
  const api = getApi();
  await api.delete(`${base}/${id}`);
}

// Extracts the filename from a Content-Disposition header, preferring the RFC 5987 extended
// `filename*=UTF-8''...` form over the plain `filename="..."` one, regardless of which appears
// first in the header. The two forms are not interchangeable: ASP.NET Core's Results.File emits
// both — the plain `filename="..."` form as an ASCII fallback with any non-ASCII character
// replaced (e.g. `Müller` becomes `M_ller`), and `filename*=UTF-8''...` percent-encoded UTF-8
// carrying every character intact. A single regex alternation tried left to right would match
// whichever form happens to appear earlier in the header — the ASCII fallback in the order this
// backend currently emits it — silently mangling any diacritics in the saved file's name (spec
// invoice-document-localization.md, requirement 22); checking the extended form unconditionally
// first avoids depending on that header ordering at all.
function extractFilename(disposition: string): string | undefined {
  const extended = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (extended?.[1]) {
    const raw = decodeURIComponent(extended[1]).trim();
    if (raw) return raw;
  }

  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  if (plain?.[1]) {
    const raw = decodeURIComponent(plain[1]).trim();
    if (raw) return raw;
  }

  return undefined;
}

export async function downloadInvoicePdf(
  id: string
): Promise<{ blob: Blob; filename: string }> {
  const api = getApi();
  const response = await api.get(`${base}/${id}/download`, { responseType: 'blob' });
  // Axios v1+ uses AxiosHeaders which requires using .get() to read header values in the browser
  const headers: any = response.headers as any;
  const disposition = (
    headers?.get?.('content-disposition') ??
    headers?.get?.('Content-Disposition') ??
    headers?.['content-disposition'] ??
    headers?.['Content-Disposition']
  ) as string | undefined;

  const filename = (disposition && extractFilename(disposition)) || `invoice-${id}.pdf`;

  return { blob: response.data as Blob, filename };
}

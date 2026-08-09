export function hasCompanyName(companyName: string | null | undefined): boolean;

export function resolveCustomerDisplayName(customer: {
  companyName: string | null | undefined;
  customerName: string;
}): string;

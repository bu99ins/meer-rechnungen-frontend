// Plain JS (not .ts) so this decision logic gets real node:test coverage, same rationale as
// jwt.js/problem.js/refreshDecision.js. A customer's company name may be empty or whitespace-only
// (an Individual customer, or a Business one the backend hasn't classified yet) — wherever the UI
// shows a customer's company name as its primary label, this resolves what to show instead.

// The single source of truth for "does this customer have a usable company name" — reused by
// resolveCustomerDisplayName below and by any caller (e.g. the invoice customer picker) that needs
// to branch on the same presence check without re-implementing the empty/whitespace-only rule.
export function hasCompanyName(companyName) {
	return (companyName ?? '').trim().length > 0;
}

export function resolveCustomerDisplayName({ companyName, customerName }) {
	return hasCompanyName(companyName) ? companyName.trim() : customerName;
}

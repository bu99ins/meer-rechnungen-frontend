// Plain JS (not .ts) so this decision logic gets real node:test coverage, same rationale as
// jwt.js/problem.js/refreshDecision.js/customerDisplay.js. Company Name and Tax/VAT ID are
// required (and shown) only for a Business customer — see specs/customer-classification-toggle.md
// requirement 4, matching the backend's own per-classification validation rules.

export function requiresCompanyFields(customerType) {
	return customerType === 'Business';
}

// Plain JS (not .ts) so it can be unit-tested directly with node:test, same pattern as
// functions/_middleware.js + test/gate.test.js. See jwt.d.ts for the exported type.

function base64UrlDecode(segment) {
	const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
	const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
	return atob(padded + padding);
}

export function decodeJwtPayload(token) {
	if (typeof token !== 'string') return null;
	const parts = token.split('.');
	if (parts.length < 2) return null;
	try {
		const json = base64UrlDecode(parts[1]);
		const payload = JSON.parse(json);
		if (payload === null || typeof payload !== 'object') return null;
		return payload;
	} catch {
		return null;
	}
}

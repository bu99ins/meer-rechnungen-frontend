// Cloudflare Pages Function — the front-door gate.
//
// Runs at the edge for every request to the deployed frontend and enforces HTTP Basic Auth against a
// single shared credential supplied via the Pages project's environment (GATE_USER / GATE_PASSWORD).
// This is the access barrier of the spec: it is host/edge-enforced (not an in-app React feature), and
// the credential is never committed. The backend API is a separate origin and is intentionally not
// behind this gate.

/** Constant-time string comparison to avoid leaking the credential via response timing. */
function timingSafeEqual(a, b) {
	if (a.length !== b.length) {
		return false;
	}
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}

/** True only when the Authorization header carries the exact configured Basic credential. */
export function isAuthorized(authHeader, user, password) {
	// A missing/blank configured credential means the gate is misconfigured — fail closed.
	if (!user || !password || !authHeader) {
		return false;
	}
	// Scheme is case-insensitive (RFC 7235); split off the base64 token.
	const sep = authHeader.indexOf(' ');
	if (sep === -1 || authHeader.slice(0, sep).toLowerCase() !== 'basic') {
		return false;
	}
	// Decode the credential as UTF-8 (matches the charset="UTF-8" challenge below) and compare the
	// plaintext "user:password". Any malformed base64 fails closed.
	let decoded;
	try {
		const bytes = Uint8Array.from(atob(authHeader.slice(sep + 1)), (ch) => ch.charCodeAt(0));
		decoded = new TextDecoder().decode(bytes);
	} catch {
		return false;
	}
	return timingSafeEqual(decoded, `${user}:${password}`);
}

export const onRequest = async (context) => {
	const { request, env, next } = context;

	if (isAuthorized(request.headers.get('Authorization'), env.GATE_USER, env.GATE_PASSWORD)) {
		return next();
	}

	return new Response('Authentication required.', {
		status: 401,
		headers: {
			'WWW-Authenticate': 'Basic realm="Meer von Rechnungen", charset="UTF-8"',
		},
	});
};

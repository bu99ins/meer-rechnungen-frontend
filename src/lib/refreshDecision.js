// Plain JS (not .ts) so this decision logic gets real node:test coverage, same rationale as
// jwt.js/problem.js. Pulled out of the axios response interceptor in api.ts so the branching
// around single-flight token renewal can be tested without mocking axios.

export function decideOnUnauthorized({ isAuthCall, alreadyRetried, hasSession, sentToken, currentToken }) {
	if (isAuthCall) return 'ignore';
	if (!hasSession) return 'ignore';
	if (alreadyRetried) return 'end-session';
	if (sentToken !== currentToken) return 'replay';
	return 'refresh';
}

export function decideAfterRefresh(outcome) {
	if (outcome === 'refreshed') return 'replay';
	if (outcome === 'rejected') return 'end-session';
	return 'ignore';
}

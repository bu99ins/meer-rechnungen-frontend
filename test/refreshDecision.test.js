import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideOnUnauthorized, decideAfterRefresh } from '../src/lib/refreshDecision.js';

test('decideOnUnauthorized: ignores 401s from the refresh/login calls themselves (prevents deadlock/loops)', () => {
	assert.equal(
		decideOnUnauthorized({ isAuthCall: true, alreadyRetried: false, hasSession: true, sentToken: 'a', currentToken: 'a' }),
		'ignore'
	);
});

test('decideOnUnauthorized: ignores 401s when there is no session left to renew (e.g. a sign-out raced this request)', () => {
	assert.equal(
		decideOnUnauthorized({ isAuthCall: false, alreadyRetried: false, hasSession: false, sentToken: 'a', currentToken: null }),
		'ignore'
	);
});

test('decideOnUnauthorized: ends the session when a request 401s again after already being retried once', () => {
	assert.equal(
		decideOnUnauthorized({ isAuthCall: false, alreadyRetried: true, hasSession: true, sentToken: 'b', currentToken: 'b' }),
		'end-session'
	);
});

test('decideOnUnauthorized: replays without a new refresh when another request already renewed the token', () => {
	assert.equal(
		decideOnUnauthorized({ isAuthCall: false, alreadyRetried: false, hasSession: true, sentToken: 'stale', currentToken: 'fresh' }),
		'replay'
	);
});

test('decideOnUnauthorized: triggers a refresh for the normal first-time case', () => {
	assert.equal(
		decideOnUnauthorized({ isAuthCall: false, alreadyRetried: false, hasSession: true, sentToken: 'a', currentToken: 'a' }),
		'refresh'
	);
});

test('decideAfterRefresh: replays once the refresh succeeded', () => {
	assert.equal(decideAfterRefresh('refreshed'), 'replay');
});

test('decideAfterRefresh: ends the session when the backend definitively rejected the refresh', () => {
	assert.equal(decideAfterRefresh('rejected'), 'end-session');
});

test('decideAfterRefresh: does not end the session on a transient/unreachable failure', () => {
	assert.equal(decideAfterRefresh('unreachable'), 'ignore');
});

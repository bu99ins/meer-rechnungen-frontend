import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAuthorized, onRequest } from '../functions/_middleware.js';

const USER = 'invited';
const PASSWORD = 'shared-secret';

// Build the header exactly as a browser does for a charset="UTF-8" challenge: UTF-8 bytes → base64.
function basicHeader(user, password) {
	const bytes = new TextEncoder().encode(`${user}:${password}`);
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return 'Basic ' + btoa(binary);
}

const goodHeader = basicHeader(USER, PASSWORD);

test('isAuthorized: accepts the correct shared credential', () => {
	assert.equal(isAuthorized(goodHeader, USER, PASSWORD), true);
});

test('isAuthorized: rejects a wrong password', () => {
	assert.equal(isAuthorized('Basic ' + btoa(`${USER}:nope`), USER, PASSWORD), false);
});

test('isAuthorized: rejects a wrong user', () => {
	assert.equal(isAuthorized('Basic ' + btoa(`nope:${PASSWORD}`), USER, PASSWORD), false);
});

test('isAuthorized: rejects a missing Authorization header', () => {
	assert.equal(isAuthorized(null, USER, PASSWORD), false);
});

test('isAuthorized: rejects a non-Basic scheme', () => {
	assert.equal(isAuthorized('Bearer sometoken', USER, PASSWORD), false);
});

test('isAuthorized: denies when the gate is misconfigured (no credential set)', () => {
	assert.equal(isAuthorized(goodHeader, '', ''), false);
});

test('isAuthorized: accepts a non-ASCII (UTF-8) credential', () => {
	const user = 'benutzer';
	const password = 'grüße-€'; // grüße-€
	assert.equal(isAuthorized(basicHeader(user, password), user, password), true);
});

test('isAuthorized: accepts a case-insensitive scheme token', () => {
	assert.equal(isAuthorized(goodHeader.replace('Basic ', 'basic '), USER, PASSWORD), true);
});

test('isAuthorized: rejects malformed base64 without throwing (fail closed)', () => {
	assert.equal(isAuthorized('Basic @@not-base64@@', USER, PASSWORD), false);
});

test('onRequest: blocks with 401 + WWW-Authenticate when no credential is supplied', async () => {
	let nextCalled = false;
	const ctx = {
		request: new Request('https://frontend.example/'),
		env: { GATE_USER: USER, GATE_PASSWORD: PASSWORD },
		next: async () => { nextCalled = true; return new Response('app'); },
	};

	const res = await onRequest(ctx);

	assert.equal(res.status, 401);
	assert.match(res.headers.get('WWW-Authenticate') ?? '', /^Basic /);
	assert.equal(nextCalled, false, 'must not reach the app without a valid credential');
});

test('onRequest: passes through to the app when the credential is correct', async () => {
	let nextCalled = false;
	const ctx = {
		request: new Request('https://frontend.example/', { headers: { Authorization: goodHeader } }),
		env: { GATE_USER: USER, GATE_PASSWORD: PASSWORD },
		next: async () => { nextCalled = true; return new Response('app'); },
	};

	const res = await onRequest(ctx);

	assert.equal(nextCalled, true);
	assert.equal(await res.text(), 'app');
});

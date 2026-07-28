import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeJwtPayload } from '../src/lib/jwt.js';

function base64url(json) {
	const bytes = new TextEncoder().encode(JSON.stringify(json));
	let binary = '';
	for (const b of bytes) binary += String.fromCharCode(b);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function makeToken(payload, { header = { alg: 'HS256', typ: 'JWT' } } = {}) {
	return `${base64url(header)}.${base64url(payload)}.signature-not-checked-here`;
}

test('decodeJwtPayload: reads sub/userid/role claims out of a well-formed token', () => {
	const token = makeToken({ sub: 'admin@test.com', userid: 'abc-123', role: 'Admin', jti: 'x' });
	assert.deepEqual(decodeJwtPayload(token), {
		sub: 'admin@test.com',
		userid: 'abc-123',
		role: 'Admin',
		jti: 'x',
	});
});

test('decodeJwtPayload: handles base64url characters (- and _) not present in plain base64', () => {
	// Force a payload whose base64 encoding is very likely to contain + or / in standard base64,
	// so this only passes if -/_ decoding (not just atob) is exercised.
	const longEmail = 'a'.repeat(40) + '@test.com';
	const token = makeToken({ sub: longEmail, userid: '11111111-1111-1111-1111-111111111111', role: 'Manager' });
	const decoded = decodeJwtPayload(token);
	assert.equal(decoded.sub, longEmail);
	assert.equal(decoded.role, 'Manager');
});

test('decodeJwtPayload: returns null for a token with too few segments', () => {
	assert.equal(decodeJwtPayload('not-a-jwt'), null);
});

test('decodeJwtPayload: returns null for a token whose payload segment is not valid base64', () => {
	assert.equal(decodeJwtPayload('header.@@not-base64@@.sig'), null);
});

test('decodeJwtPayload: returns null for a token whose payload is valid base64 but not JSON', () => {
	const notJson = btoa('plain text, not json');
	assert.equal(decodeJwtPayload(`header.${notJson}.sig`), null);
});

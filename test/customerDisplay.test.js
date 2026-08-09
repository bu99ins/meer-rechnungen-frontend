import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasCompanyName, resolveCustomerDisplayName } from '../src/lib/customerDisplay.js';

test('resolveCustomerDisplayName: uses the company name when present', () => {
	assert.equal(
		resolveCustomerDisplayName({ companyName: 'Acme GmbH', customerName: 'Erika Musterfrau' }),
		'Acme GmbH'
	);
});

test('resolveCustomerDisplayName: falls back to the customer name when companyName is an empty string', () => {
	assert.equal(
		resolveCustomerDisplayName({ companyName: '', customerName: 'Erika Musterfrau' }),
		'Erika Musterfrau'
	);
});

test('resolveCustomerDisplayName: falls back to the customer name when companyName is whitespace-only', () => {
	assert.equal(
		resolveCustomerDisplayName({ companyName: '   ', customerName: 'Erika Musterfrau' }),
		'Erika Musterfrau'
	);
});

test('resolveCustomerDisplayName: falls back to the customer name when companyName is undefined', () => {
	assert.equal(
		resolveCustomerDisplayName({ customerName: 'Erika Musterfrau' }),
		'Erika Musterfrau'
	);
});

test('resolveCustomerDisplayName: falls back to the customer name when companyName is null', () => {
	assert.equal(
		resolveCustomerDisplayName({ companyName: null, customerName: 'Erika Musterfrau' }),
		'Erika Musterfrau'
	);
});

test('resolveCustomerDisplayName: trims a company name with leading/trailing whitespace', () => {
	assert.equal(
		resolveCustomerDisplayName({ companyName: '  Acme GmbH  ', customerName: 'Erika Musterfrau' }),
		'Acme GmbH'
	);
});

test('hasCompanyName: true for a present company name', () => {
	assert.equal(hasCompanyName('Acme GmbH'), true);
});

test('hasCompanyName: false for an empty string', () => {
	assert.equal(hasCompanyName(''), false);
});

test('hasCompanyName: false for whitespace-only', () => {
	assert.equal(hasCompanyName('   '), false);
});

test('hasCompanyName: false for undefined', () => {
	assert.equal(hasCompanyName(undefined), false);
});

test('hasCompanyName: false for null', () => {
	assert.equal(hasCompanyName(null), false);
});

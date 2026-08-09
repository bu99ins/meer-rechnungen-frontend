import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requiresCompanyFields } from '../src/lib/customerClassification.js';

test('requiresCompanyFields: true for Business', () => {
	assert.equal(requiresCompanyFields('Business'), true);
});

test('requiresCompanyFields: false for Individual', () => {
	assert.equal(requiresCompanyFields('Individual'), false);
});

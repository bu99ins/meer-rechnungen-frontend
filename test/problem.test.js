import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeApiError } from '../src/lib/problem.js';

test('describeApiError: uses a ValidationProblem-shaped errors dictionary', () => {
	const err = {
		response: {
			status: 400,
			data: {
				title: 'One or more validation errors occurred.',
				errors: {
					Password: ['Password must be at least 8 characters long'],
					Email: ['Email must be a valid email address'],
				},
			},
		},
	};
	const message = describeApiError(err);
	assert.match(message, /Password must be at least 8 characters long/);
	assert.match(message, /Email must be a valid email address/);
});

test('describeApiError: uses a ProblemDetails "detail" field when there is no errors dictionary', () => {
	const err = {
		response: {
			status: 404,
			data: { title: 'Not Found', detail: 'User with ID abc123 not found' },
		},
	};
	assert.equal(describeApiError(err), 'User with ID abc123 not found');
});

test('describeApiError: falls back to the ProblemDetails "title" when there is no "detail"', () => {
	const err = {
		response: {
			status: 409,
			data: { title: 'Conflict' },
		},
	};
	assert.equal(describeApiError(err), 'Conflict');
});

test('describeApiError: falls back to a generic message when the response has no usable body', () => {
	const err = { response: { status: 500, data: null } };
	assert.equal(describeApiError(err), 'Request failed (500).');
});

test('describeApiError: falls back to a generic message when there is no response at all (network error)', () => {
	const err = { message: 'Network Error' };
	assert.equal(describeApiError(err), 'Network Error');
});

test('describeApiError: falls back to a fixed string when nothing usable is present at all', () => {
	assert.equal(describeApiError({}), 'Something went wrong. Please try again.');
});

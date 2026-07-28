// Plain JS (not .ts), same rationale as jwt.js — see problem.d.ts for the exported type.
// Turns an axios error carrying a backend ProblemDetails/ValidationProblem body into one
// human-readable string, so failures can be shown verbatim on-screen (R25, R28).

export function describeApiError(error) {
	const data = error?.response?.data;

	if (data && typeof data === 'object') {
		if (data.errors && typeof data.errors === 'object') {
			const messages = Object.values(data.errors).flat().filter((m) => typeof m === 'string' && m);
			if (messages.length > 0) return messages.join(' ');
		}
		if (typeof data.detail === 'string' && data.detail) return data.detail;
		if (typeof data.title === 'string' && data.title) return data.title;
	}

	if (error?.response) {
		return `Request failed (${error.response.status}).`;
	}

	if (typeof error?.message === 'string' && error.message) return error.message;

	return 'Something went wrong. Please try again.';
}

import React from 'react';

// The marker is a CSS `::after` pseudo-element with generated content, not a real text node: a
// literal "*" appended to the label's DOM text would change its accessible name and break every
// existing `getByLabelText('Customer Name')`-style query in the test suite (which — correctly —
// expects the label text itself to be exactly what it says, unaffected by req 10's no-wording-
// change rule). Generated content renders visually but never enters `textContent`, so the marker
// is invisible to both the accessibility tree's name computation and to DOM text queries.
export const Label: React.FC<{ htmlFor?: string; required?: boolean; children: React.ReactNode }> = ({ htmlFor, required, children }) => (
  <label
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 ${required ? "after:content-['*'] after:ml-0.5 after:text-brand-deep" : ''}`}
  >
    {children}
  </label>
);

// A short legend forms carry alongside their fields, per requirement 12 — explains what the
// label asterisk means. `* Required field` matches the marker rendered by Label above.
export const RequiredLegend: React.FC = () => (
  <p className="text-xs text-brand-gray">
    <span className="text-brand-deep" aria-hidden="true">*</span> Required field
  </p>
);

type BaseProps = {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
};

// Required-field treatment (requirements 11, 13, 14): only a field that has BOTH a visible label
// and `required` gets the marker/treatment — the invoice line-item inputs pass neither, so they
// stay untouched by construction, not by a special case. The distinct input treatment is a sky
// accent border (an accent, not the sole carrier — it's paired with the label asterisk) that is
// always present once the conditions hold, so it doesn't depend on interaction. The native
// `:user-invalid` pseudo-class (fires after the browser has judged a required-and-empty field
// invalid — typically after a blur or a submit attempt, not on first paint) repaints the same
// input red, purely in CSS: no JS state, no page-level behaviour change. Its selector carries one
// extra pseudo-class over the plain accent-border classes, so it always wins on specificity
// regardless of class order, keeping the error look reliably on top of the required look
// (requirement 13). The `error` prop (programmatic, e.g. a cross-field mismatch) is checked first
// and — when present — replaces the required treatment outright rather than layering on it, so it
// always wins too.
function isRequiredField(label: string | undefined, required: boolean | undefined) {
  return Boolean(label) && Boolean(required);
}

// `:user-invalid` is attached regardless of `isReq`: an optional field can still carry a type
// constraint (e.g. Email's `type="email"`) that native validation rejects and blocks submission
// on — that field must not stay silently gray while the browser refuses to submit around it.
function inputStateClasses(error: string | undefined, isReq: boolean) {
  if (error) return 'border-red-300 focus:ring-red-500';
  const invalidOverride = '[&:user-invalid]:border-red-300 [&:user-invalid]:border-l-red-300 [&:user-invalid]:focus:ring-red-500';
  if (isReq) {
    return `border-gray-300 border-l-4 border-l-brand-sky focus:ring-brand-deep ${invalidOverride}`;
  }
  return `border-gray-300 focus:ring-brand-deep ${invalidOverride}`;
}

export const TextInput: React.FC<
  BaseProps & React.InputHTMLAttributes<HTMLInputElement>
> = ({ label, error, hint, className = '', id, required, ...rest }) => {
  const isReq = isRequiredField(label, required);
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <Label htmlFor={id} required={isReq}>{label}</Label>}
      <input
        id={id}
        required={required}
        {...rest}
        className={`w-full rounded-md border ${inputStateClasses(error, isReq)} px-3 py-2 text-sm focus:outline-none focus:ring-2`}
      />
      {hint && !error && <p className="text-xs text-brand-gray">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export const NumberInput: React.FC<
  BaseProps & React.InputHTMLAttributes<HTMLInputElement>
> = ({ label, error, hint, className = '', id, required, ...rest }) => {
  const isReq = isRequiredField(label, required);
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <Label htmlFor={id} required={isReq}>{label}</Label>}
      <input
        id={id}
        type="number"
        step="any"
        required={required}
        {...rest}
        className={`w-full rounded-md border ${inputStateClasses(error, isReq)} px-3 py-2 text-sm focus:outline-none focus:ring-2`}
      />
      {hint && !error && <p className="text-xs text-brand-gray">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export const SelectInput: React.FC<
  BaseProps & React.SelectHTMLAttributes<HTMLSelectElement>
> = ({ label, error, hint, className = '', id, children, required, ...rest }) => {
  const isReq = isRequiredField(label, required);
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <Label htmlFor={id} required={isReq}>{label}</Label>}
      <select
        id={id}
        required={required}
        {...rest}
        className={`w-full rounded-md border ${inputStateClasses(error, isReq)} px-3 py-2 text-sm focus:outline-none focus:ring-2 bg-white`}
      >
        {children}
      </select>
      {hint && !error && <p className="text-xs text-brand-gray">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export const TextArea: React.FC<
  BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>
> = ({ label, error, hint, className = '', id, required, ...rest }) => {
  const isReq = isRequiredField(label, required);
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <Label htmlFor={id} required={isReq}>{label}</Label>}
      <textarea
        id={id}
        required={required}
        {...rest}
        className={`w-full rounded-md border ${inputStateClasses(error, isReq)} px-3 py-2 text-sm focus:outline-none focus:ring-2`}
      />
      {hint && !error && <p className="text-xs text-brand-gray">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Label, RequiredLegend, TextInput } from './Form';

// Requirements 11-14: a required field (label + `required`) must be visually distinguishable from
// an optional one in two ways at once — a label marker and a distinct input treatment — while a
// field with no label (the invoice line-item inputs) gets neither, regardless of `required`. The
// marker itself is asserted via className rather than rendered text: it's shipped as a CSS
// `::after` pseudo-element (see Form.tsx) precisely so it never becomes part of the label's DOM
// text/accessible name, which jsdom doesn't compute pseudo-element content for either — so the
// class list is the correct, and only, thing to assert here.
describe('Label required marker', () => {
  it('carries the asterisk marker class when required', () => {
    render(<Label htmlFor="x" required>Company Name</Label>);
    expect(screen.getByText('Company Name')).toHaveClass("after:content-['*']");
  });

  it('carries no marker class when not required', () => {
    render(<Label htmlFor="x">Postal Code</Label>);
    expect(screen.getByText('Postal Code')).not.toHaveClass("after:content-['*']");
  });

  it('does not add the literal asterisk character to the label text', () => {
    render(<Label htmlFor="x" required>Company Name</Label>);
    // getByLabelText below (via TextInput tests) already proves this in practice; here we assert
    // the DOM text directly stays exactly the given text, unaffected by the required marker.
    expect(screen.getByText('Company Name').textContent).toBe('Company Name');
  });
});

describe('TextInput required treatment (requirements 11, 13, 14)', () => {
  it('marks a labelled required field with both the label marker and a distinct input treatment', () => {
    render(<TextInput id="companyName" label="Company Name" required value="" onChange={() => {}} />);
    // Exact-match label lookup must still work — the marker must never appear in the DOM text.
    expect(screen.getByLabelText('Company Name')).toHaveClass('border-l-brand-sky');
    expect(screen.getByText('Company Name')).toHaveClass("after:content-['*']");
  });

  it('gives an optional labelled field neither the marker nor the required input treatment', () => {
    render(<TextInput id="postalCode" label="Postal Code" value="" onChange={() => {}} />);
    expect(screen.getByLabelText('Postal Code')).not.toHaveClass('border-l-brand-sky');
    expect(screen.getByText('Postal Code')).not.toHaveClass("after:content-['*']");
  });

  it('gives a required field with no label neither marker nor treatment (line-item inputs)', () => {
    render(<TextInput id="itemName" placeholder="Item name" required value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Item name')).not.toHaveClass('border-l-brand-sky');
    // No label element is rendered at all when `label` is omitted.
    expect(screen.queryByText('Item name')).toBeNull();
  });

  it('lets the error treatment override the required treatment (requirement 13)', () => {
    render(
      <TextInput id="confirmPassword" label="Confirm password" required value="" onChange={() => {}} error="Passwords don't match." />
    );
    const input = screen.getByLabelText('Confirm password');
    expect(input).toHaveClass('border-red-300');
    expect(input).not.toHaveClass('border-l-brand-sky');
  });
});

describe('RequiredLegend', () => {
  it('renders the required-field legend text', () => {
    render(<RequiredLegend />);
    expect(screen.getByText('Required field', { exact: false })).toBeTruthy();
  });
});

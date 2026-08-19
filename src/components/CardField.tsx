import React from 'react';

type Props = {
  label: string;
  value: React.ReactNode;
  align?: 'left' | 'right';
};

// A labelled field within a narrow-viewport list card — mirrors what a table column header + cell
// carries, so no value on the card is anonymous the way an unlabelled row would be (req 7).
// `break-words` is load-bearing: without it an unbreakable long value (an email address, a
// Tax/VAT id) refuses to wrap and pushes the whole page wider than the viewport at 320px
// (measured: removing it alone reproduces the overflow). `min-w-0` is belt-and-braces on the grid
// item — as a grid item it defaults to `min-width: auto`, which can otherwise stop it shrinking
// to begin with — but `break-words` is the part actually holding the layout at 320px.
const CardField: React.FC<Props> = ({ label, value, align = 'left' }) => (
  <div className={`min-w-0 ${align === 'right' ? 'text-right' : ''}`}>
    <div className="text-xs font-medium text-brand-gray uppercase tracking-wider">{label}</div>
    <div className="text-sm text-gray-900 break-words">{value}</div>
  </div>
);

export default CardField;

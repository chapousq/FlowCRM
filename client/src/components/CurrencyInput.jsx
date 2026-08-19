import { useState, useCallback } from 'react';

export function formatCurrency(value) {
  if (value === '' || value === null || value === undefined) return '';
  const num = typeof value === 'string' ? parseInt(value.replace(/\D/g, ''), 10) : value;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num / 100);
}

export function parseCurrencyInput(raw) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return { display: '', value: '' };
  const num = parseInt(digits, 10);
  const display = formatCurrency(num);
  return { display, value: num / 100 };
}

export default function CurrencyInput({ value, onChange, placeholder = 'R$ 0,00', ...props }) {
  const [display, setDisplay] = useState(() => {
    if (value && value > 0) return formatCurrency(Math.round(value * 100));
    return '';
  });

  const handleChange = useCallback((e) => {
    const raw = e.target.value;
    const { display: newDisplay, value: newValue } = parseCurrencyInput(raw);
    setDisplay(newDisplay);
    onChange({ target: { value: newValue } });
  }, [onChange]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      placeholder={placeholder}
      {...props}
    />
  );
}

export function formatDisplay(value) {
  if (!value && value !== 0) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

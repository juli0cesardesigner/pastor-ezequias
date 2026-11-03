import React, { useState, useEffect } from 'react';

interface DateTextInputProps {
  value: string; // YYYY-MM-DD
  onChange: (dateYMD: string) => void;
  className?: string;
}

export const DateTextInput: React.FC<DateTextInputProps> = ({
  value,
  onChange,
  className = '',
}) => {
  // Converte YYYY-MM-DD em DD/MM/AAAA para exibição/digitação
  const ymdToDmy = (ymd: string) => {
    if (!ymd) return '';
    const parts = ymd.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return ymd;
  };

  const [text, setText] = useState(ymdToDmy(value));

  useEffect(() => {
    setText(ymdToDmy(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, ''); // só números
    if (raw.length > 8) raw = raw.slice(0, 8);

    // Formata automaticamente como DD/MM/AAAA enquanto digita
    let formatted = raw;
    if (raw.length > 2 && raw.length <= 4) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    } else if (raw.length > 4) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    }

    setText(formatted);

    // Se preencheu os 8 dígitos válidos, atualiza a data YYYY-MM-DD
    if (raw.length === 8) {
      const day = raw.slice(0, 2);
      const month = raw.slice(2, 4);
      const year = raw.slice(4, 8);
      const parsedYMD = `${year}-${month}-${day}`;
      const d = new Date(`${parsedYMD}T12:00:00`);
      if (!isNaN(d.getTime())) {
        onChange(parsedYMD);
      }
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/AAAA"
      value={text}
      onChange={handleChange}
      className={`agenda-clean-input date-text-input ${className}`}
      maxLength={10}
      required
    />
  );
};


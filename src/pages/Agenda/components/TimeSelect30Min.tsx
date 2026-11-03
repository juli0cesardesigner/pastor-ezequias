import React, { useState, useEffect } from 'react';

interface TimeSelect30MinProps {
  value: string; // Formato HH:MM
  onChange: (time: string) => void;
}

export const TimeSelect30Min: React.FC<TimeSelect30MinProps> = ({
  value,
  onChange,
}) => {
  const defaultSlots: string[] = [];
  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0');
    defaultSlots.push(`${hh}:00`);
    defaultSlots.push(`${hh}:30`);
  }

  const isPredefined = defaultSlots.includes(value);
  const [isCustomMode, setIsCustomMode] = useState(!isPredefined && !!value);

  useEffect(() => {
    if (!defaultSlots.includes(value) && value) {
      setIsCustomMode(true);
    }
  }, [value]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomMode(true);
    } else {
      setIsCustomMode(false);
      onChange(val);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="time-select-30min-wrapper">
      {!isCustomMode ? (
        <select
          value={value}
          onChange={handleSelectChange}
          className="agenda-clean-input"
        >
          {defaultSlots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
          <option value="custom">Outro horário...</option>
        </select>
      ) : (
        <div className="time-custom-input-box">
          <input
            type="time"
            value={value}
            onChange={handleCustomChange}
            className="agenda-clean-input"
            autoFocus
          />
          <button
            type="button"
            className="time-quick-back-btn"
            onClick={() => {
              setIsCustomMode(false);
              onChange('09:00');
            }}
          >
            Lista
          </button>
        </div>
      )}
    </div>
  );
};

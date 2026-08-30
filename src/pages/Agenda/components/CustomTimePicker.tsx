import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CustomTimePickerProps {
  value: string; // Formato HH:MM
  onChange: (timeHHMM: string) => void;
  className?: string;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentH, currentM] = value ? value.split(':') : ['09', '00'];

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const quickTimes = ['08:00', '09:00', '10:30', '14:00', '16:00', '18:00', '19:30', '20:00'];

  const handleHourSelect = (h: string) => {
    onChange(`${h}:${currentM || '00'}`);
  };

  const handleMinuteSelect = (m: string) => {
    onChange(`${currentH || '09'}:${m}`);
  };

  const handleQuickSelect = (t: string) => {
    onChange(t);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`custom-timepicker-container ${className}`}>
      <button
        type="button"
        className={`custom-timepicker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Clock size={16} className="text-gold" />
        <span className="timepicker-display-value">{value || '09:00'}</span>
      </button>

      {isOpen && (
        <div className="custom-timepicker-popover">
          <div className="timepicker-quick-section">
            <span className="timepicker-section-title">Horários Frequentes</span>
            <div className="timepicker-quick-chips">
              {quickTimes.map((qt) => (
                <button
                  key={qt}
                  type="button"
                  className={`time-chip ${qt === value ? 'selected' : ''}`}
                  onClick={() => handleQuickSelect(qt)}
                >
                  {qt}
                </button>
              ))}
            </div>
          </div>

          <div className="timepicker-columns-wrapper">
            <div className="time-col">
              <span className="time-col-header">Horas</span>
              <div className="time-col-list">
                {hours.map((h) => (
                  <button
                    key={`h-${h}`}
                    type="button"
                    className={`time-item ${h === currentH ? 'selected' : ''}`}
                    onClick={() => handleHourSelect(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="time-col-divider">:</div>

            <div className="time-col">
              <span className="time-col-header">Minutos</span>
              <div className="time-col-list">
                {minutes.map((m) => (
                  <button
                    key={`m-${m}`}
                    type="button"
                    className={`time-item ${m === currentM ? 'selected' : ''}`}
                    onClick={() => handleMinuteSelect(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="timepicker-popover-footer">
            <button
              type="button"
              className="btn-timepicker-ok"
              onClick={() => setIsOpen(false)}
            >
              Confirmar Horário
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

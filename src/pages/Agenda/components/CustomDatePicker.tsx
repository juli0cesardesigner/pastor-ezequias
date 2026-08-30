import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // Formato YYYY-MM-DD
  onChange: (dateYMD: string) => void;
  label?: string;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse inicial da data
  const initialDate = value ? new Date(`${value}T12:00:00`) : new Date();
  const [viewDate, setViewDate] = useState<Date>(initialDate);

  // Sincroniza viewDate caso value mude externamente
  useEffect(() => {
    if (value) {
      setViewDate(new Date(`${value}T12:00:00`));
    }
  }, [value]);

  // Click outside para fechar
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

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const formatDisplay = (ymd: string) => {
    if (!ymd) return 'Selecione uma data';
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  };

  const toYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const setToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    onChange(toYMD(now));
    setViewDate(now);
    setIsOpen(false);
  };

  // Gerar grade do mês
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayYMD = toYMD(new Date());

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="custom-calendar-cell empty" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateYMD = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = dateYMD === value;
    const isToday = dateYMD === todayYMD;

    days.push(
      <button
        key={`d-${d}`}
        type="button"
        className={`custom-calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
        onClick={() => {
          onChange(dateYMD);
          setIsOpen(false);
        }}
      >
        <span>{d}</span>
      </button>
    );
  }

  return (
    <div ref={containerRef} className={`custom-datepicker-container ${className}`}>
      <button
        type="button"
        className={`custom-datepicker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon size={16} className="text-gold" />
        <span className="datepicker-display-value">{formatDisplay(value)}</span>
      </button>

      {isOpen && (
        <div className="custom-datepicker-popover">
          <div className="custom-datepicker-header">
            <button type="button" className="cal-pop-btn" onClick={prevMonth} aria-label="Mês anterior">
              <ChevronLeft size={16} />
            </button>
            <span className="cal-pop-title">
              {monthNames[month]} {year}
            </span>
            <button type="button" className="cal-pop-btn" onClick={nextMonth} aria-label="Próximo mês">
              <ChevronRight size={16} />
            </button>
            <button type="button" className="cal-pop-today-btn" onClick={setToday}>
              Hoje
            </button>
          </div>

          <div className="custom-datepicker-weekdays">
            <span>D</span>
            <span>S</span>
            <span>T</span>
            <span>Q</span>
            <span>Q</span>
            <span>S</span>
            <span>S</span>
          </div>

          <div className="custom-datepicker-grid">{days}</div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AgendaEventType } from '../../../types/agenda';
import { IosSinglePickerModal } from './IosTimePickerModal';

export interface CalendarDayEventMeta {
  type: AgendaEventType;
}

interface InlineMonthCalendarProps {
  value: string; // YYYY-MM-DD
  onChange: (dateYMD: string) => void;
  dayEventsMap?: Record<string, CalendarDayEventMeta[]>;
}

export const InlineMonthCalendar: React.FC<InlineMonthCalendarProps> = ({
  value,
  onChange,
  dayEventsMap = {},
}) => {
  const initialDate = value ? new Date(`${value}T12:00:00`) : new Date();
  const [viewDate, setViewDate] = useState<Date>(initialDate);

  // Modais de roleta estilo iPhone para Mês e Ano
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  useEffect(() => {
    if (value) {
      setViewDate(new Date(`${value}T12:00:00`));
    }
  }, [value]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const weekDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Anos de 2020 a 2035 (com loop infinito)
  const availableYears = Array.from({ length: 25 }, (_, i) => String(2020 + i));

  const toYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectMonth = (selectedMonthName: string) => {
    const mIdx = monthNames.indexOf(selectedMonthName);
    if (mIdx !== -1) {
      const updated = new Date(viewDate.getFullYear(), mIdx, 1);
      setViewDate(updated);
      onChange(toYMD(updated));
    }
  };

  const handleSelectYear = (selectedYearStr: string) => {
    const yNum = parseInt(selectedYearStr, 10);
    if (!isNaN(yNum)) {
      const updated = new Date(yNum, viewDate.getMonth(), 1);
      setViewDate(updated);
      onChange(toYMD(updated));
    }
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayYMD = toYMD(new Date());

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(<div key={`empty-${i}`} className="inline-calendar-cell empty" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateYMD = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isSelected = dateYMD === value;
    const isToday = dateYMD === todayYMD;
    const dayEvents = dayEventsMap[dateYMD] || [];

    const count = dayEvents.length;
    let sizeClass = 'size-normal';
    if (count >= 6) {
      sizeClass = 'size-micro';
    } else if (count >= 4) {
      sizeClass = 'size-compact';
    }

    days.push(
      <button
        key={`d-${d}`}
        type="button"
        className={`inline-calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
        onClick={() => onChange(dateYMD)}
      >
        <span className="cal-day-num">{d}</span>

        {count > 0 && (
          <div className={`calendar-dots-container ${sizeClass}`}>
            {dayEvents.map((meta, idx) => {
              const isImportant = meta.type === 'data_importante';
              return (
                <span
                  key={idx}
                  className={`calendar-event-dot ${isImportant ? 'dot-important' : 'dot-compromisso'}`}
                />
              );
            })}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="inline-calendar-card">
      {/* Mês e Ano clicáveis com setas uma em cada ponta */}
      <div className="inline-calendar-header-centered">
        <button
          type="button"
          className="inline-cal-nav-btn"
          onClick={prevMonth}
          aria-label="Mês Anterior"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="inline-cal-title-center clickable-header">
          <button
            type="button"
            className="calendar-month-year-btn"
            onClick={() => setIsMonthPickerOpen(true)}
            title="Selecionar Mês"
          >
            {monthNames[month]}
          </button>
          <button
            type="button"
            className="calendar-month-year-btn"
            onClick={() => setIsYearPickerOpen(true)}
            title="Selecionar Ano"
          >
            {year}
          </button>
        </div>

        <button
          type="button"
          className="inline-cal-nav-btn"
          onClick={nextMonth}
          aria-label="Próximo Mês"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="inline-calendar-weekdays">
        {weekDayNames.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="inline-calendar-grid">
        {days}
      </div>

      {/* Seletor Estilo iPhone para Mês (Janeiro a Dezembro Infinito) */}
      <IosSinglePickerModal
        isOpen={isMonthPickerOpen}
        title="Mês"
        items={monthNames}
        value={monthNames[month]}
        onChange={handleSelectMonth}
        onClose={() => setIsMonthPickerOpen(false)}
        loop={true}
      />

      {/* Seletor Estilo iPhone para Ano (Infinito) */}
      <IosSinglePickerModal
        isOpen={isYearPickerOpen}
        title="Ano"
        items={availableYears}
        value={String(year)}
        onChange={handleSelectYear}
        onClose={() => setIsYearPickerOpen(false)}
        loop={true}
      />
    </div>
  );
};

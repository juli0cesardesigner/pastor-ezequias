import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AgendaDayStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  eventsCountByDate: Record<string, number>;
}

export const AgendaDayStrip: React.FC<AgendaDayStripProps> = ({
  selectedDate,
  onSelectDate,
  eventsCountByDate,
}) => {
  // Gera 14 dias a partir de 2 dias atrás
  const days = useMemo(() => {
    const list: Array<{
      dateStr: string;
      dayOfWeek: string;
      dayNum: string;
      isToday: boolean;
      isSelected: boolean;
      count: number;
    }> = [];

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const startDate = new Date();
    startDate.setDate(now.getDate() - 2);

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < 14; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      list.push({
        dateStr,
        dayOfWeek: weekDays[d.getDay()],
        dayNum: dd,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        count: eventsCountByDate[dateStr] || 0,
      });
    }
    return list;
  }, [selectedDate, eventsCountByDate]);

  const handlePrevDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() - 1);
    const prevStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    onSelectDate(prevStr);
  };

  const handleNextDay = () => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + 1);
    const nextStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    onSelectDate(nextStr);
  };

  const handleTodayClick = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    onSelectDate(todayStr);
  };

  return (
    <div className="agenda-day-strip-container">
      <div className="agenda-day-strip-header">
        <button className="agenda-today-tag" onClick={handleTodayClick}>
          Ir para Hoje
        </button>
        <div className="agenda-nav-arrows">
          <button onClick={handlePrevDay} aria-label="Dia Anterior">
            <ChevronLeft size={18} />
          </button>
          <button onClick={handleNextDay} aria-label="Próximo Dia">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="agenda-day-strip-scroll">
        {days.map((d) => (
          <button
            key={d.dateStr}
            className={`agenda-day-card ${d.isSelected ? 'selected' : ''} ${d.isToday ? 'today' : ''}`}
            onClick={() => onSelectDate(d.dateStr)}
          >
            <span className="agenda-day-week">{d.dayOfWeek}</span>
            <span className="agenda-day-num">{d.dayNum}</span>
            {d.count > 0 && (
              <span className="agenda-day-badge" title={`${d.count} evento(s)`}>
                {d.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};


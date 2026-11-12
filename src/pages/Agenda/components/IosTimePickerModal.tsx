import React, { useState, useEffect, useRef } from 'react';

interface IosWheelPickerProps {
  items: string[];
  selectedItem: string;
  onSelect: (item: string) => void;
  loop?: boolean; // Infinite scroll
  wide?: boolean;
  className?: string;
}

const ITEM_HEIGHT = 42;
const VISIBLE_ITEMS = 5;

export const IosWheelPicker: React.FC<IosWheelPickerProps> = ({
  items,
  selectedItem,
  onSelect,
  loop = false,
  wide = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Se loop for ativado, repete os itens 5 vezes para efeito de loop infinito
  const repeatCount = loop ? 5 : 1;
  const virtualItems: string[] = [];
  for (let r = 0; r < repeatCount; r++) {
    virtualItems.push(...items);
  }

  const baseCount = items.length;
  const middleOffset = loop ? Math.floor(repeatCount / 2) * baseCount : 0;

  // Inicializa o scroll no bloco central
  useEffect(() => {
    const rawIdx = items.indexOf(selectedItem);
    if (rawIdx !== -1 && containerRef.current) {
      const targetIndex = loop ? middleOffset + rawIdx : rawIdx;
      containerRef.current.scrollTop = targetIndex * ITEM_HEIGHT;
    }
  }, []);

  // Quando mudar externamente
  useEffect(() => {
    if (!isScrollingRef.current && containerRef.current) {
      const rawIdx = items.indexOf(selectedItem);
      if (rawIdx !== -1) {
        const currentScroll = containerRef.current.scrollTop;
        const currentIdx = Math.round(currentScroll / ITEM_HEIGHT);
        // Encontra o múltiplo mais próximo
        const currentCycle = loop ? Math.floor(currentIdx / baseCount) : 0;
        const targetIndex = currentCycle * baseCount + rawIdx;
        const targetScroll = targetIndex * ITEM_HEIGHT;
        if (Math.abs(currentScroll - targetScroll) > 2) {
          containerRef.current.scrollTo({
            top: targetScroll,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [selectedItem, items, loop, baseCount]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    isScrollingRef.current = true;

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      if (!containerRef.current) return;
      const currentScroll = containerRef.current.scrollTop;
      let index = Math.round(currentScroll / ITEM_HEIGHT);
      index = Math.max(0, Math.min(virtualItems.length - 1, index));

      // Snap para a linha exata
      containerRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth',
      });

      const actualIndex = index % baseCount;
      if (items[actualIndex] !== selectedItem) {
        onSelect(items[actualIndex]);
      }

      // Se for loop e estiver muito próximo dos extremos, recentraliza sem transição
      if (loop) {
        const minSnapIndex = baseCount;
        const maxSnapIndex = baseCount * (repeatCount - 1);
        if (index < minSnapIndex || index >= maxSnapIndex) {
          const recenteredIndex = middleOffset + actualIndex;
          containerRef.current.scrollTop = recenteredIndex * ITEM_HEIGHT;
        }
      }

      isScrollingRef.current = false;
    }, 100);
  };

  const handleItemClick = (virtualIndex: number) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: virtualIndex * ITEM_HEIGHT,
        behavior: 'smooth',
      });
      const actualIndex = virtualIndex % baseCount;
      onSelect(items[actualIndex]);
    }
  };

  return (
    <div className={`ios-wheel-column ${className} ${wide ? 'wide' : ''}`.trim()}>
      <div
        ref={containerRef}
        className="ios-wheel-scroll"
        onScroll={handleScroll}
        style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
      >
        <div style={{ height: ITEM_HEIGHT * 2, flexShrink: 0 }} />

        {virtualItems.map((item, idx) => {
          const actualItem = items[idx % baseCount];
          const isSelected = actualItem === selectedItem;
          return (
            <div
              key={`${item}-${idx}`}
              className={`ios-wheel-item ${isSelected ? 'selected' : ''}`}
              style={{ height: ITEM_HEIGHT }}
              onClick={() => handleItemClick(idx)}
            >
              {item}
            </div>
          );
        })}

        <div style={{ height: ITEM_HEIGHT * 2, flexShrink: 0 }} />
      </div>
    </div>
  );
};

/* ==========================================================================
   1. SELETOR DE HORÁRIO (24H INFINITO)
   ========================================================================== */
interface IosTimePickerModalProps {
  isOpen: boolean;
  value: string; // HH:MM
  onChange: (newTime: string) => void;
  onClose: () => void;
}

export const IosTimePickerModal: React.FC<IosTimePickerModalProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
}) => {
  const [currentHour, setCurrentHour] = useState('09');
  const [currentMinute, setCurrentMinute] = useState('00');

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h, m] = value.split(':');
      setCurrentHour(h.padStart(2, '0'));
      setCurrentMinute(m.padStart(2, '0'));
    }
  }, [value, isOpen]);

  if (!isOpen) return null;

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleSave = () => {
    onChange(`${currentHour}:${currentMinute}`);
    onClose();
  };

  return (
    <div className="ios-time-picker-overlay" onClick={onClose}>
      <div
        className="ios-time-picker-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ios-time-picker-topbar">
          <button type="button" className="ios-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <span className="ios-time-picker-title">Horário</span>
          <button type="button" className="ios-btn-save" onClick={handleSave}>
            Salvar
          </button>
        </div>

        <div className="ios-wheel-wrapper">
          <div className="ios-wheel-selection-highlight" />

          {/* Horas 00-23 com loop infinito */}
          <IosWheelPicker
            items={hours}
            selectedItem={currentHour}
            onSelect={setCurrentHour}
            loop={true}
          />

          <span className="ios-wheel-separator">:</span>

          {/* Minutos 00-59 com loop infinito */}
          <IosWheelPicker
            items={minutes}
            selectedItem={currentMinute}
            onSelect={setCurrentMinute}
            loop={true}
          />
        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   2. SELETOR DE MÊS (JANEIRO A DEZEMBRO - LOOP INFINITO)
   ========================================================================== */
interface IosSinglePickerModalProps {
  isOpen: boolean;
  title: string;
  items: string[];
  value: string;
  onChange: (selected: string) => void;
  onClose: () => void;
  loop?: boolean;
}

export const IosSinglePickerModal: React.FC<IosSinglePickerModalProps> = ({
  isOpen,
  title,
  items,
  value,
  onChange,
  onClose,
  loop = false,
}) => {
  const [selected, setSelected] = useState(value);

  useEffect(() => {
    setSelected(value);
  }, [value, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onChange(selected);
    onClose();
  };

  return (
    <div className="ios-time-picker-overlay" onClick={onClose}>
      <div
        className="ios-time-picker-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ios-time-picker-topbar">
          <button type="button" className="ios-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <span className="ios-time-picker-title">{title}</span>
          <button type="button" className="ios-btn-save" onClick={handleSave}>
            Salvar
          </button>
        </div>

        <div className="ios-wheel-wrapper">
          <div className="ios-wheel-selection-highlight" />

          <IosWheelPicker
            items={items}
            selectedItem={selected}
            onSelect={setSelected}
            loop={loop}
            wide={items.some((it) => it.length > 5)}
          />

        </div>
      </div>
    </div>
  );
};

/* ==========================================================================
   3. SELETOR DE DATA ESTILO IPHONE WHEEL (DIA, MÊS, ANO)
   ========================================================================== */
interface IosDatePickerModalProps {
  isOpen: boolean;
  value: string; // YYYY-MM-DD
  onChange: (newDateYMD: string) => void;
  onClose: () => void;
}

const MONTH_NAMES_BR = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const parseInitialDate = (val: string) => {
  let y = new Date().getFullYear();
  let m = new Date().getMonth();
  let d = new Date().getDate();

  if (val && val.includes('-')) {
    const parts = val.split('-');
    if (parts.length === 3) {
      y = parseInt(parts[0], 10) || y;
      m = (parseInt(parts[1], 10) - 1);
      if (m < 0 || m > 11) m = 0;
      d = parseInt(parts[2], 10) || d;
    }
  }
  return {
    day: String(d).padStart(2, '0'),
    month: MONTH_NAMES_BR[m] || 'Janeiro',
    year: String(y),
  };
};

export const IosDatePickerModal: React.FC<IosDatePickerModalProps> = ({
  isOpen,
  value,
  onChange,
  onClose,
}) => {
  const [currentDay, setCurrentDay] = useState(() => parseInitialDate(value).day);
  const [currentMonth, setCurrentMonth] = useState(() => parseInitialDate(value).month);
  const [currentYear, setCurrentYear] = useState(() => parseInitialDate(value).year);

  useEffect(() => {
    if (isOpen) {
      const init = parseInitialDate(value);
      setCurrentDay(init.day);
      setCurrentMonth(init.month);
      setCurrentYear(init.year);
    }
  }, [value, isOpen]);

  if (!isOpen) return null;

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
  const currentYearNum = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => String(currentYearNum - 2 + i));

  const handleSave = () => {
    const mIdx = MONTH_NAMES_BR.indexOf(currentMonth);
    const monthNum = mIdx !== -1 ? mIdx + 1 : 1;
    const yearNum = parseInt(currentYear, 10) || currentYearNum;

    const maxDaysInMonth = new Date(yearNum, monthNum, 0).getDate();
    let dayNum = parseInt(currentDay, 10) || 1;
    if (dayNum > maxDaysInMonth) {
      dayNum = maxDaysInMonth;
    }

    const ymd = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    onChange(ymd);
    onClose();
  };

  return (
    <div className="ios-time-picker-overlay" onClick={onClose}>
      <div
        className="ios-time-picker-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ios-time-picker-topbar">
          <button type="button" className="ios-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <span className="ios-time-picker-title">Data</span>
          <button type="button" className="ios-btn-save emerald" onClick={handleSave}>
            Salvar
          </button>
        </div>

        <div className="ios-wheel-wrapper ios-date-wheel-wrapper">
          <div className="ios-wheel-selection-highlight" />

          {/* Dia: 01 a 31 */}
          <IosWheelPicker
            items={days}
            selectedItem={currentDay}
            onSelect={setCurrentDay}
            loop={true}
            className="col-day"
          />

          {/* Mês: Janeiro a Dezembro */}
          <IosWheelPicker
            items={MONTH_NAMES_BR}
            selectedItem={currentMonth}
            onSelect={setCurrentMonth}
            loop={true}
            wide={true}
            className="col-month"
          />

          {/* Ano */}
          <IosWheelPicker
            items={years}
            selectedItem={currentYear}
            onSelect={setCurrentYear}
            loop={false}
            className="col-year"
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  colorDot?: string;
}

interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  icon?: React.ReactNode;
  placeholder?: string;
  className?: string;
  labelPrefix?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  value,
  onChange,
  options,
  icon,
  placeholder,
  className = '',
  labelPrefix,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div
      ref={containerRef}
      className={`custom-dropdown-container ${className} ${isOpen ? 'is-open' : ''}`}
    >
      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="trigger-content">
          {icon && <span className="trigger-icon">{icon}</span>}
          {selectedOption?.colorDot && (
            <span
              className="option-color-dot"
              style={{ backgroundColor: selectedOption.colorDot }}
            />
          )}
          <span className="trigger-label">
            {labelPrefix ? `${labelPrefix}: ` : ''}
            {selectedOption ? selectedOption.label : placeholder || 'Selecione'}
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`chevron-icon ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <div className="item-left">
                  {option.icon && <span className="item-icon">{option.icon}</span>}
                  {option.colorDot && (
                    <span
                      className="option-color-dot"
                      style={{ backgroundColor: option.colorDot }}
                    />
                  )}
                  <span className="item-label">{option.label}</span>
                </div>
                {isSelected && <Check size={14} className="item-check text-gold" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

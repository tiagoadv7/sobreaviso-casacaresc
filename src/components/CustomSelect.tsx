import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
  badge?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção',
  id,
  disabled = false,
  className = '',
  buttonClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger = containerRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) {
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

  // Posiciona o menu via portal (fixed), fora de qualquer container com overflow,
  // para nunca ficar cortado/atrás de modais. Escolhe abrir para cima quando
  // não há espaço suficiente abaixo, e usa o espaço real disponível na tela
  // como altura máxima (evita scroll desnecessário quando cabe tudo).
  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const margin = 8;
      const spaceBelow = viewportH - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openUpward = spaceBelow < 200 && spaceAbove > spaceBelow;
      const available = Math.max(160, (openUpward ? spaceAbove : spaceBelow));

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        maxHeight: available,
        ...(openUpward
          ? { bottom: viewportH - rect.top + 6 }
          : { top: rect.bottom + 6 }),
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative w-full flex items-center justify-center gap-2 pl-8 pr-8 py-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-semibold text-neutral-900 transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#319685]/30 ${
          isOpen ? 'ring-2 ring-[#319685] border-transparent' : 'hover:border-black/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center justify-center gap-2 truncate min-w-0">
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 text-neutral-500">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#319685]' : ''
          }`}
        />
      </button>

      {/* Rounded Dropdown Menu — renderizado via portal para nunca ficar
          cortado ou atrás de modais/containers com overflow */}
      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="z-[999] bg-[#ffffff] border border-black/10 rounded-2xl p-1.5 shadow-xl shadow-black/10 overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        >
          {options.length === 0 ? (
            <div className="py-2.5 px-3 text-center text-xs text-neutral-400">
              Nenhuma opção disponível
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#319685]/15 text-[#084F42] font-semibold'
                        : 'text-neutral-700 hover:bg-[#DEEDE0]/40 hover:text-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      {option.color && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      {option.icon && (
                        <span className="shrink-0 text-neutral-500">{option.icon}</span>
                      )}
                      <div className="truncate">
                        <div className="truncate">{option.label}</div>
                        {option.subtitle && (
                          <div className="text-[10px] text-neutral-400 font-normal">
                            {option.subtitle}
                          </div>
                        )}
                      </div>
                      {option.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600 font-medium">
                          {option.badge}
                        </span>
                      )}
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 text-[#319685] shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

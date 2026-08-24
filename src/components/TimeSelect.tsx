import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

interface TimeSelectProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

// Substitui o <input type="time"> nativo, cujo popup de seleção (horas e
// minutos rolando em colunas) é desenhado pelo navegador e não pode ser
// estilizado — sempre aparece com cantos retos, fora do padrão visual do
// sistema. Este componente reproduz a mesma ideia (duas colunas roláveis)
// só que com o cartão arredondado do resto do app.
export const TimeSelect: React.FC<TimeSelectProps> = ({
  value,
  onChange,
  id,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const [hh, mm] = value && value.includes(':') ? value.split(':') : ['', ''];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideTrigger = containerRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideTrigger && !insideMenu) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current!.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const margin = 8;
      const menuHeight = 208;
      const spaceBelow = viewportH - rect.bottom - margin;
      const openUpward = spaceBelow < menuHeight && rect.top - margin > spaceBelow;

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: Math.max(rect.width, 140),
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

  // Centraliza a hora/minuto atual na lista ao abrir, como o picker nativo.
  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      hourListRef.current
        ?.querySelector(`[data-active="true"]`)
        ?.scrollIntoView({ block: 'center' });
      minuteListRef.current
        ?.querySelector(`[data-active="true"]`)
        ?.scrollIntoView({ block: 'center' });
    });
  }, [isOpen]);

  const handlePickHour = (h: string) => onChange(`${h}:${mm || '00'}`);
  const handlePickMinute = (m: string) => onChange(`${hh || '00'}:${m}`);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#319685]/30 ${
          isOpen ? 'ring-2 ring-[#319685] border-transparent' : 'hover:border-black/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <span className="truncate tabular-nums">{value || '--:--'}</span>
      </button>

      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="z-[999] bg-[#ffffff] border border-black/10 rounded-2xl shadow-xl shadow-black/10 flex divide-x divide-black/5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div ref={hourListRef} className="flex-1 max-h-52 overflow-y-auto py-1.5">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                data-active={h === hh}
                onClick={() => handlePickHour(h)}
                className={`w-full py-1.5 text-xs font-semibold text-center transition-colors cursor-pointer tabular-nums ${
                  h === hh
                    ? 'bg-[#319685]/15 text-[#084F42]'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
          <div ref={minuteListRef} className="flex-1 max-h-52 overflow-y-auto py-1.5">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                data-active={m === mm}
                onClick={() => handlePickMinute(m)}
                className={`w-full py-1.5 text-xs font-semibold text-center transition-colors cursor-pointer tabular-nums ${
                  m === mm
                    ? 'bg-[#319685]/15 text-[#084F42]'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { MONTH_NAMES } from '../../utils/constants';

interface MonthYearPickerModalProps {
  isOpen: boolean;
  currentYear: number;
  currentMonth: number;
  onClose: () => void;
  onConfirm: (year: number, month: number) => void;
}

export const MonthYearPickerModal: React.FC<MonthYearPickerModalProps> = ({
  isOpen,
  currentYear,
  currentMonth,
  onClose,
  onConfirm,
}) => {
  const [pickedYear, setPickedYear] = useState(currentYear);
  const [pickedMonth, setPickedMonth] = useState(currentMonth);
  const [yearRangeStart, setYearRangeStart] = useState(currentYear - 5);

  useEffect(() => {
    if (isOpen) {
      setPickedYear(currentYear);
      setPickedMonth(currentMonth);
      setYearRangeStart(currentYear - 5);
    }
  }, [isOpen, currentYear, currentMonth]);

  if (!isOpen) return null;

  const years = Array.from({ length: 12 }, (_, i) => yearRangeStart + i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#319685]/15 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5 text-[#084F42]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Selecione o mês</h3>
              <p className="text-xs text-neutral-400 font-medium">
                {MONTH_NAMES[pickedMonth]} de {pickedYear}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Year stepper + grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setYearRangeStart((y) => y - 12)}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Anos anteriores"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-neutral-500">
              {years[0]}–{years[years.length - 1]}
            </span>
            <button
              type="button"
              onClick={() => setYearRangeStart((y) => y + 12)}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Próximos anos"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => setPickedYear(y)}
                className={`py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  y === pickedYear
                    ? 'bg-[#319685] text-white shadow-sm'
                    : y === currentYear
                    ? 'text-[#319685] font-bold hover:bg-neutral-100'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-black/5">
          {MONTH_NAMES.map((name, i) => (
            <button
              key={name}
              type="button"
              onClick={() => setPickedMonth(i)}
              className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                i === pickedMonth
                  ? 'bg-[#319685] text-white shadow-sm'
                  : 'text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2 border-t border-black/5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-black/10 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(pickedYear, pickedMonth);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 transition-all cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

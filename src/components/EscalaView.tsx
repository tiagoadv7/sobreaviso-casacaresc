import React, { useState } from 'react';
import { Collaborator, DaySchedule, CallRecord } from '../types';
import { MONTH_NAMES } from '../utils/constants';
import { collaboratorStatusLabel, fmtHours } from '../utils/calc';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarRange, Clock } from 'lucide-react';
import { MonthYearPickerModal } from './modals/MonthYearPickerModal';

interface EscalaViewProps {
  collaborators: Collaborator[];
  schedule: DaySchedule[];
  calls: CallRecord[];
  currentYear: number;
  currentMonth: number;
  isAdmin: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectMonth: (month: number) => void;
  onSelectYear: (year: number) => void;
  onGoToToday: () => void;
  onOpenDayModal: (daySchedule: DaySchedule) => void;
  onOpenWeekScheduleModal: () => void;
}

export const EscalaView: React.FC<EscalaViewProps> = ({
  collaborators,
  schedule,
  calls,
  currentYear,
  currentMonth,
  isAdmin,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
  onSelectYear,
  onGoToToday,
  onOpenDayModal,
  onOpenWeekScheduleModal,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const activeCollabs = collaborators.filter((c) => c.status === 'ativo');

  // Compute leading blanks for Monday-first calendar
  const firstJsWeekday = new Date(currentYear, currentMonth, 1).getDay(); // 0 Dom..6 Sab
  const leadingBlanks = (firstJsWeekday + 6) % 7;

  const calendarCells: (DaySchedule | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) {
    calendarCells.push(null);
  }
  schedule.forEach((d) => calendarCells.push(d));
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  // Weeks summary
  const weekIndexes = Array.from(new Set(schedule.map((d) => d.weekIndex))).sort((a: number, b: number) => a - b);

  const weeklyHours = weekIndexes.map((wi) => {
    const daysInWeek = schedule.filter((d) => d.weekIndex === wi);
    const totals: Record<string, number> = {};
    collaborators.forEach((c) => {
      totals[c.id] = 0;
    });
    daysInWeek.forEach((d) => {
      if (totals[d.collaboratorId] !== undefined) totals[d.collaboratorId] += d.hours;
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    const first = daysInWeek[0]?.day;
    const last = daysInWeek[daysInWeek.length - 1]?.day;
    return {
      weekIndex: wi,
      label: `Semana ${wi} (${first}-${last})`,
      totals,
      total,
    };
  });

  const weeklyCalls = weekIndexes.map((wi) => {
    const daysInWeek = schedule.filter((d) => d.weekIndex === wi).map((d) => d.day);
    const counts: Record<string, number> = {};
    collaborators.forEach((c) => {
      counts[c.id] = 0;
    });
    calls.forEach((call) => {
      if (daysInWeek.includes(call.day) && counts[call.collaboratorId] !== undefined) {
        counts[call.collaboratorId]++;
      }
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const first = daysInWeek[0];
    const last = daysInWeek[daysInWeek.length - 1];
    return {
      weekIndex: wi,
      label: `Semana ${wi} (${first}-${last})`,
      counts,
      total,
    };
  });

  return (
    <div className="space-y-6">
      {/* Month Navigator Toolbar + Legend */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs space-y-4 hover:border-black/20 transition-all">
        {/* Navegação de mês — mesmo comportamento em mobile e desktop: o
            "pill" com mês/ano abre o seletor completo (MonthYearPickerModal)
            em vez de dropdowns separados de mês e ano. */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-col items-center gap-1.5">
            {/* Uma única cápsula arredondada — setas e mês/ano no mesmo
                bloco, sem espaço entre eles. */}
            <div className="flex items-center rounded-full border border-black/10 bg-[#fcfcfb] shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={onPrevMonth}
                className="p-2.5 hover:bg-[#f4f4f1] text-neutral-700 transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#f4f4f1] transition-colors cursor-pointer"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-[#319685]" />
                <span className="text-sm font-bold text-neutral-800 capitalize">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
              </button>

              <button
                type="button"
                onClick={onNextMonth}
                className="p-2.5 hover:bg-[#f4f4f1] text-neutral-700 transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onGoToToday}
              className="text-[11px] font-semibold text-[#319685] hover:text-[#084F42] cursor-pointer"
            >
              Hoje
            </button>
          </div>

          {isAdmin ? (
            <button
              type="button"
              onClick={onOpenWeekScheduleModal}
              className="w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 transition-all cursor-pointer"
            >
              <CalendarRange className="w-4 h-4" />
              Adicionar escala da semana
            </button>
          ) : (
            <div className="hidden lg:block text-xs text-neutral-400 font-medium">
              Clique em qualquer dia do calendário para editar o plantão e os chamados
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/5">
          {collaborators.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${c.color}15`, color: c.color }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}
              {c.status !== 'ativo' && (
                <span className="text-[10px] opacity-70 font-normal">
                  ({collaboratorStatusLabel(c).toLowerCase()})
                </span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs hover:border-black/20 transition-all overflow-x-auto">
        <div className="min-w-[640px]">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-3 text-center text-xs font-bold text-neutral-400 mb-3">
          <div className="py-1">Segunda</div>
          <div className="py-1">Terça</div>
          <div className="py-1">Quarta</div>
          <div className="py-1">Quinta</div>
          <div className="py-1">Sexta</div>
          <div className="py-1">Sábado</div>
          <div className="py-1">Domingo</div>
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-3">
          {calendarCells.map((dayItem, idx) => {
            if (!dayItem) {
              return <div key={`blank-${idx}`} className="min-h-[92px] rounded-2xl bg-transparent" />;
            }

            const collab = collaborators.find((c) => c.id === dayItem.collaboratorId);
            const dayCalls = calls.filter((c) => c.day === dayItem.day);

            return (
              <button
                key={dayItem.date}
                type="button"
                onClick={() => onOpenDayModal(dayItem)}
                className={`min-h-[92px] rounded-2xl border p-3 flex flex-col justify-between text-left transition-all hover:bg-neutral-50 hover:-translate-y-0.5 cursor-pointer shadow-2xs ${
                  dayItem.isCustom
                    ? 'border-[#319685]/40 bg-[#DEEDE0]/30 ring-1 ring-[#319685]/25'
                    : 'border-black/10 bg-[#fcfcfb]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 tabular-nums">
                    {dayItem.day}
                  </span>
                  {dayItem.isCustom && (
                    <span className="w-2 h-2 rounded-full bg-[#319685]" title="Horário personalizado" />
                  )}
                </div>

                <div className="my-1.5 space-y-1">
                  {collab && (
                    <span
                      className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold truncate max-w-full"
                      style={{ backgroundColor: `${collab.color}18`, color: collab.color }}
                    >
                      {collab.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium mt-auto pt-1 border-t border-black/5">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-300" />
                    {fmtHours(dayItem.hours)}h
                  </span>
                  {dayCalls.length > 0 && (
                    <span className="font-bold text-[#084F42] bg-[#319685]/15 px-1.5 py-0.5 rounded-md">
                      {dayCalls.length} atend.
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {/* Resumo semanal de horas Table */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs overflow-x-auto hover:border-black/20 transition-all">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-neutral-900">Resumo semanal de horas</h2>
          <p className="text-xs text-neutral-400">Soma de horas por semana e colaboradora ativa</p>
        </div>

        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-black/10 text-neutral-400 text-[11px] font-semibold">
              <th className="py-2.5 px-3">Semana</th>
              {activeCollabs.map((c) => (
                <th key={c.id} className="py-2.5 px-3">
                  {c.name}
                </th>
              ))}
              <th className="py-2.5 px-3 font-bold text-neutral-700">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 tabular-nums">
            {weeklyHours.map((w) => (
              <tr key={w.weekIndex} className="hover:bg-neutral-50/60 transition-colors">
                <td className="py-2.5 px-3 font-bold text-neutral-800">{w.label}</td>
                {activeCollabs.map((c) => (
                  <td key={c.id} className="py-2.5 px-3 text-neutral-600">
                    {fmtHours(w.totals[c.id] || 0)}h
                  </td>
                ))}
                <td className="py-2.5 px-3 font-bold text-neutral-900">{fmtHours(w.total)}h</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Atendimentos por semana Table */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs overflow-x-auto hover:border-black/20 transition-all">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-neutral-900">Atendimentos por semana</h2>
          <p className="text-xs text-neutral-400">Quantidade de demandas registradas por semana e colaboradora</p>
        </div>

        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-black/10 text-neutral-400 text-[11px] font-semibold">
              <th className="py-2.5 px-3">Semana</th>
              {activeCollabs.map((c) => (
                <th key={c.id} className="py-2.5 px-3">
                  {c.name}
                </th>
              ))}
              <th className="py-2.5 px-3 font-bold text-neutral-700">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 tabular-nums">
            {weeklyCalls.map((w) => (
              <tr key={w.weekIndex} className="hover:bg-neutral-50/60 transition-colors">
                <td className="py-2.5 px-3 font-bold text-neutral-800">{w.label}</td>
                {activeCollabs.map((c) => (
                  <td key={c.id} className="py-2.5 px-3 text-neutral-600">
                    {w.counts[c.id] || 0}
                  </td>
                ))}
                <td className="py-2.5 px-3 font-bold text-neutral-900">{w.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MonthYearPickerModal
        isOpen={isPickerOpen}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onClose={() => setIsPickerOpen(false)}
        onConfirm={(year, month) => {
          onSelectYear(year);
          onSelectMonth(month);
        }}
      />
    </div>
  );
};

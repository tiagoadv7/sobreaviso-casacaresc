import React from 'react';
import { Collaborator, DaySchedule, CallRecord } from '../types';
import { MONTH_NAMES } from '../utils/constants';
import { fmtHours } from '../utils/calc';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';

interface EscalaViewProps {
  collaborators: Collaborator[];
  schedule: DaySchedule[];
  calls: CallRecord[];
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectMonth: (month: number) => void;
  onSelectYear: (year: number) => void;
  onGoToToday: () => void;
  onOpenDayModal: (daySchedule: DaySchedule) => void;
}

export const EscalaView: React.FC<EscalaViewProps> = ({
  collaborators,
  schedule,
  calls,
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onSelectMonth,
  onSelectYear,
  onGoToToday,
  onOpenDayModal,
}) => {
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

  // Month & Year Select options
  const monthOptions: SelectOption[] = MONTH_NAMES.map((name, i) => ({
    value: String(i),
    label: name,
    icon: <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />,
  }));

  const yearOptions: SelectOption[] = Array.from({ length: 11 }, (_, i) => {
    const y = currentYear - 5 + i;
    return {
      value: String(y),
      label: String(y),
    };
  });

  return (
    <div className="space-y-6">
      {/* Month Navigator Toolbar + Legend */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs space-y-4 hover:border-black/20 transition-all">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onPrevMonth}
              className="p-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] hover:bg-[#f4f4f1] text-neutral-700 transition-colors cursor-pointer shadow-2xs"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Select Mês */}
            <div className="min-w-[150px]">
              <CustomSelect
                options={monthOptions}
                value={String(currentMonth)}
                onChange={(val) => onSelectMonth(parseInt(val, 10))}
              />
            </div>

            {/* Select Ano */}
            <div className="min-w-[110px]">
              <CustomSelect
                options={yearOptions}
                value={String(currentYear)}
                onChange={(val) => onSelectYear(parseInt(val, 10))}
              />
            </div>

            <button
              type="button"
              onClick={onNextMonth}
              className="p-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] hover:bg-[#f4f4f1] text-neutral-700 transition-colors cursor-pointer shadow-2xs"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onGoToToday}
              className="px-4 py-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] hover:bg-[#f4f4f1] text-xs font-semibold text-neutral-800 transition-colors cursor-pointer shadow-2xs"
            >
              Hoje
            </button>
          </div>

          <div className="text-xs text-neutral-400 font-medium">
            Clique em qualquer dia do calendário para editar o plantão e os chamados
          </div>
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
              {c.status === 'licenca' && (
                <span className="text-[10px] opacity-70 font-normal">(licença)</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs hover:border-black/20 transition-all">
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
    </div>
  );
};

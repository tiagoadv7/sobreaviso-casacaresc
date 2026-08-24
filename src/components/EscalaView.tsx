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

  // Totais do mês por colaboradora — usados na legenda centralizada abaixo dos gráficos
  const hoursByCollabTotal: Record<string, number> = {};
  const callsByCollabTotal: Record<string, number> = {};
  activeCollabs.forEach((c) => {
    hoursByCollabTotal[c.id] = weeklyHours.reduce((sum, w) => sum + (w.totals[c.id] || 0), 0);
    callsByCollabTotal[c.id] = weeklyCalls.reduce((sum, w) => sum + (w.counts[c.id] || 0), 0);
  });

  return (
    <div className="space-y-6">
      {/* Month Navigator Toolbar + Legend */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xs space-y-3 sm:space-y-4 hover:border-black/20 transition-all">
        {/* Navegação de mês — mesmo comportamento em mobile e desktop: o
            "pill" com mês/ano abre o seletor completo (MonthYearPickerModal)
            em vez de dropdowns separados de mês e ano. */}
        <div className="flex items-center justify-center lg:justify-between gap-3 flex-wrap">
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
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-2.5 sm:pt-3 border-t border-black/5">
          {collaborators.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold"
              style={{ backgroundColor: `${c.color}15`, color: c.color }}
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
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
      <div className="bg-[#fcfcfb] border border-black/10 rounded-2xl sm:rounded-3xl p-2.5 sm:p-6 shadow-xs hover:border-black/20 transition-all">
        {/* Days of week header — abreviado no mobile para caber sem scroll lateral */}
        <div className="grid grid-cols-7 gap-1 sm:gap-3 text-center text-[10px] sm:text-xs font-bold text-neutral-400 mb-1.5 sm:mb-3">
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((label) => (
            <div key={label} className="py-1">
              <span className="sm:hidden">{label.slice(0, 3)}</span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-3">
          {calendarCells.map((dayItem, idx) => {
            if (!dayItem) {
              return <div key={`blank-${idx}`} className="min-h-[58px] sm:min-h-[92px] rounded-xl sm:rounded-2xl bg-transparent" />;
            }

            const collab = collaborators.find((c) => c.id === dayItem.collaboratorId);
            const dayCalls = calls.filter((c) => c.day === dayItem.day);

            return (
              <button
                key={dayItem.date}
                type="button"
                onClick={() => onOpenDayModal(dayItem)}
                className={`min-h-[58px] sm:min-h-[92px] rounded-xl sm:rounded-2xl border p-1 sm:p-3 flex flex-col justify-between text-left transition-all hover:bg-neutral-50 hover:-translate-y-0.5 cursor-pointer shadow-2xs overflow-hidden ${
                  dayItem.isCustom
                    ? 'border-[#319685]/40 bg-[#DEEDE0]/30 ring-1 ring-[#319685]/25'
                    : 'border-black/10 bg-[#fcfcfb]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-neutral-800 tabular-nums">
                    {dayItem.day}
                  </span>
                  {dayItem.isCustom && (
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#319685]" title="Horário personalizado" />
                  )}
                </div>

                <div className="my-0.5 sm:my-1.5 space-y-1">
                  {collab && (
                    <span
                      className="inline-block px-1 sm:px-2.5 py-0.5 rounded-full text-[8px] sm:text-[11px] font-bold truncate max-w-full"
                      style={{ backgroundColor: `${collab.color}18`, color: collab.color }}
                    >
                      {collab.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[8px] sm:text-[11px] font-medium mt-auto pt-1 border-t border-black/5 gap-0.5">
                  <span className="text-neutral-400 flex items-center gap-0.5 sm:gap-1 truncate">
                    <Clock className="hidden sm:block w-3 h-3 text-neutral-300 shrink-0" />
                    {fmtHours(dayItem.hours)}h
                  </span>
                  {dayCalls.length > 0 && (
                    <span className="font-bold text-[#084F42] bg-[#319685]/15 px-1 sm:px-1.5 py-0.5 rounded-md shrink-0">
                      {dayCalls.length}<span className="hidden sm:inline"> atend.</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resumo semanal de horas */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xs hover:border-black/20 transition-all">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-sm font-bold text-neutral-900">Resumo semanal de horas</h2>
          <p className="text-xs text-neutral-400">Soma de horas por semana e colaboradora ativa</p>
        </div>

        <div className="h-52 sm:h-64 w-full">
          <SvgWeeklyBarChart
            weeks={weeklyHours.map((w) => ({ weekIndex: w.weekIndex, values: w.totals, total: w.total }))}
            activeCollabs={activeCollabs}
            unit="h"
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2.5 mt-1 sm:mt-2 border-t border-black/5">
          {activeCollabs.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100/80"
              style={{ color: c.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}: {fmtHours(hoursByCollabTotal[c.id] || 0)}h
            </span>
          ))}
        </div>
      </div>

      {/* Atendimentos por semana */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-xs hover:border-black/20 transition-all">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-sm font-bold text-neutral-900">Atendimentos por semana</h2>
          <p className="text-xs text-neutral-400">Quantidade de demandas registradas por semana e colaboradora</p>
        </div>

        <div className="h-52 sm:h-64 w-full">
          <SvgWeeklyBarChart
            weeks={weeklyCalls.map((w) => ({ weekIndex: w.weekIndex, values: w.counts, total: w.total }))}
            activeCollabs={activeCollabs}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2.5 mt-1 sm:mt-2 border-t border-black/5">
          {activeCollabs.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100/80"
              style={{ color: c.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
              {c.name}: {callsByCollabTotal[c.id] || 0}
            </span>
          ))}
        </div>
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

// Gráfico de barras empilhadas por semana (uma barra por semana, segmentos
// coloridos por colaboradora) — mesmo estilo visual dos gráficos do Dashboard.
const SvgWeeklyBarChart: React.FC<{
  weeks: { weekIndex: number; values: Record<string, number>; total: number }[];
  activeCollabs: Collaborator[];
  unit?: string;
}> = ({ weeks, activeCollabs, unit = '' }) => {
  const W = 640;
  const H = 240;
  const padL = 34;
  const padB = 26;
  const padT = 15;
  const padR = 10;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxTotal = Math.max(4, Math.ceil((Math.max(...weeks.map((w) => w.total), 4) * 1.1) / 4) * 4);
  const n = weeks.length;
  const slot = innerW / Math.max(n, 1);
  const barW = Math.min(44, slot * 0.55);

  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {gridLevels.map((frac, i) => {
        const val = Math.round(maxTotal * frac);
        const y = padT + innerH - innerH * frac;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e5e0" strokeWidth="1" />
            <text x={padL - 8} y={y + 4} fontSize="11" fill="#898781" textAnchor="end">
              {val}
            </text>
          </g>
        );
      })}

      {weeks.map((w, i) => {
        const x = padL + slot * i + (slot - barW) / 2;
        let yCursor = padT + innerH;

        return (
          <g key={w.weekIndex}>
            {activeCollabs.map((c) => {
              const v = w.values[c.id] || 0;
              if (v <= 0) return null;
              const segH = innerH * (v / maxTotal);
              yCursor -= segH;
              return (
                <rect
                  key={c.id}
                  x={x}
                  y={yCursor}
                  width={barW}
                  height={Math.max(segH - 1, 0)}
                  fill={c.color}
                  rx={2}
                  className="transition-all hover:opacity-85"
                >
                  <title>{`${c.name} — Semana ${w.weekIndex}: ${v}${unit}`}</title>
                </rect>
              );
            })}
            <text
              x={x + barW / 2}
              y={padT + innerH + 18}
              fontSize="12"
              fontWeight="500"
              fill="#52514e"
              textAnchor="middle"
            >
              S{w.weekIndex}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

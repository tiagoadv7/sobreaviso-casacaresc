import {
  Collaborator,
  CallRecord,
  DaySchedule,
  HECalculationRow,
  ShiftKind,
} from '../types';
import { WEEKDAY_LABELS, MONTH_NAMES } from './constants';

// Horário padrão sugerido por tipo de turno — plantão noturno nos dias de
// semana, 24h aos sábados e domingos. Usado como ponto de partida ao
// agendar um dia ou uma semana inteira; o administrador pode sempre editar.
export function defaultShiftHoursForKind(kind: ShiftKind): { start: string; end: string } {
  const isWeekend = kind === 'fim_de_semana' || kind === 'apoio';
  return { start: isWeekend ? '07:30' : '18:00', end: '07:30' };
}

export function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Rótulo exibido para o status do colaborador — centralizado aqui porque
// vários lugares (lista de colaboradores, seletores de escala, legendas)
// precisam do mesmo texto, inclusive o rótulo livre do status "Personalizado".
export function collaboratorStatusLabel(c: Pick<Collaborator, 'status' | 'customStatusLabel'>): string {
  switch (c.status) {
    case 'licenca':
      return 'Em licença';
    case 'ferias':
      return 'Férias';
    case 'personalizado':
      return c.customStatusLabel.trim() || 'Personalizado';
    default:
      return 'Ativo';
  }
}

export function monthLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month]}/${year}`;
}

export function weekIndexForDay(day: number, year: number, month: number): number {
  const firstJsWeekday = new Date(year, month, 1).getDay(); // 0 Dom..6 Sab
  const leadingBlanks = (firstJsWeekday + 6) % 7; // Monday-first offset
  return Math.floor((leadingBlanks + day - 1) / 7) + 1;
}

export function buildSchedule(
  year: number,
  month: number,
  collaborators: Collaborator[],
  overrides?: Record<string, Partial<DaySchedule>>
): DaySchedule[] {
  const days: DaySchedule[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const jsWeekday = dateObj.getDay();
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;

    const kind: ShiftKind = jsWeekday === 6 ? 'fim_de_semana' : jsWeekday === 0 ? 'apoio' : 'semana';

    // Dia sem plantão cadastrado: sem colaborador e sem horas até que um
    // administrador registre o turno (scheduleOverrides) para essa data.
    const defaultDay: DaySchedule = {
      day,
      date: dateStr,
      weekIndex: weekIndexForDay(day, year, month),
      weekdayLabel: WEEKDAY_LABELS[jsWeekday],
      jsWeekday,
      collaboratorId: '',
      start: '',
      end: '',
      hours: 0,
      kind,
      demand: jsWeekday === 0 || jsWeekday === 6 ? 'Emergência' : 'Suporte noturno',
    };

    if (overrides && overrides[dateStr]) {
      Object.assign(defaultDay, overrides[dateStr], { isCustom: true });
    }

    days.push(defaultDay);
  }

  return days;
}

export function fmtHours(n: number): string {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 0 });
}

export function timeToMinutes(t: string): number {
  if (!t || !t.includes(':')) return 0;
  const [hh, mm] = t.split(':').map((x) => parseInt(x, 10));
  return (hh || 0) * 60 + (mm || 0);
}

export function computeDurationHours(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0;
  const a = timeToMinutes(inicio);
  const b = timeToMinutes(fim);
  let diff = b - a;
  if (diff <= 0) diff += 24 * 60;
  return diff / 60;
}

export function computeDurationText(inicio: string, fim: string): string {
  if (!inicio || !fim) return '-';
  const a = timeToMinutes(inicio);
  const b = timeToMinutes(fim);
  let diff = b - a;
  if (diff <= 0) diff += 24 * 60;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return `${h}h${m ? ` ${pad(m)}min` : ''}`;
}

export function isNightMinute(min: number): boolean {
  return min >= 22 * 60 || min < 5 * 60;
}

export function computeNightMinutes(inicio: string, fim: string): number {
  if (!inicio || !fim) return 0;
  const a = timeToMinutes(inicio);
  const b = timeToMinutes(fim);
  let diff = b - a;
  if (diff <= 0) diff += 24 * 60;
  let night = 0;
  for (let i = 0; i < diff; i++) {
    if (isNightMinute((a + i) % 1440)) {
      night++;
    }
  }
  return night;
}

export function getCallHECategory(
  call: CallRecord,
  year: number,
  month: number
): { isSunday: boolean; dayHours: number; nightHours: number } {
  const d = new Date(year, month, call.day);
  const isSunday = d.getDay() === 0;
  let totalMin = 0;
  if (call.inicio && call.fim) {
    const a = timeToMinutes(call.inicio);
    const b = timeToMinutes(call.fim);
    totalMin = b - a;
    if (totalMin <= 0) totalMin += 24 * 60;
  }
  const nightMin = computeNightMinutes(call.inicio, call.fim);
  const dayMin = Math.max(totalMin - nightMin, 0);

  return {
    isSunday,
    dayHours: dayMin / 60,
    nightHours: nightMin / 60,
  };
}

export function calcHEByCollaborator(
  calls: CallRecord[],
  collaborators: Collaborator[],
  year: number,
  month: number
): Record<string, HECalculationRow> {
  const rows: Record<string, HECalculationRow> = {};
  collaborators.forEach((c) => {
    rows[c.id] = { he75a: 0, he100b: 0, he75c: 0, he100d: 0, atendimentos: 0 };
  });

  calls.forEach((call) => {
    if (!rows[call.collaboratorId]) return;
    rows[call.collaboratorId].atendimentos++;
    if (!call.inicio || !call.fim) return;

    const cat = getCallHECategory(call, year, month);
    if (cat.isSunday) {
      rows[call.collaboratorId].he100b += cat.dayHours;
      rows[call.collaboratorId].he100d += cat.nightHours;
    } else {
      rows[call.collaboratorId].he75a += cat.dayHours;
      rows[call.collaboratorId].he75c += cat.nightHours;
    }
  });

  return rows;
}

export function mixColor(hex: string, percent: number): string {
  // If browser supports color-mix
  return `color-mix(in srgb, ${hex} ${percent}%, transparent)`;
}

export function exportCsvFile(filename: string, rows: (string | number)[][]): void {
  const csvContent = rows
    .map((r) =>
      r
        .map((v) => `"${String(v !== undefined && v !== null ? v : '').replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

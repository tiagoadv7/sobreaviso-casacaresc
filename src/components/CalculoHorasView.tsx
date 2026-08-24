import React, { useState } from 'react';
import { Collaborator, CallRecord, DaySchedule } from '../types';
import { fmtHours, calcHEByCollaborator } from '../utils/calc';
import { PhoneCall, Sigma, Clock, FilterX, Info, AlertTriangle, Users } from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';

interface CalculoHorasViewProps {
  collaborators: Collaborator[];
  calls: CallRecord[];
  schedule: DaySchedule[];
  currentYear: number;
  currentMonth: number;
}

export const CalculoHorasView: React.FC<CalculoHorasViewProps> = ({
  collaborators,
  calls,
  schedule,
  currentYear,
  currentMonth,
}) => {
  const [filterCollab, setFilterCollab] = useState<string>('');

  // Shift hours per collaborator in month
  const totalsByCollab: Record<string, number> = {};
  collaborators.forEach((c) => {
    totalsByCollab[c.id] = 0;
  });
  schedule.forEach((d) => {
    if (d.collaboratorId && totalsByCollab[d.collaboratorId] !== undefined) {
      totalsByCollab[d.collaboratorId] += d.hours;
    }
  });

  // Filtered calls
  const relevantCalls = filterCollab
    ? calls.filter((c) => c.collaboratorId === filterCollab)
    : calls;

  const relevantCollabs = filterCollab
    ? collaborators.filter((c) => c.id === filterCollab)
    : collaborators;

  const heMap = calcHEByCollaborator(relevantCalls, relevantCollabs, currentYear, currentMonth);

  // Totals calculations
  let totalAtendimentos = 0;
  let totalHE = 0;
  let totalSobreaviso = 0;

  const sums = {
    sobreaviso: 0,
    he75a: 0,
    he100b: 0,
    he75c: 0,
    he100d: 0,
    atendimentos: 0,
  };

  relevantCollabs.forEach((c) => {
    const r = heMap[c.id] || { he75a: 0, he100b: 0, he75c: 0, he100d: 0, atendimentos: 0 };
    const sobreaviso = totalsByCollab[c.id] || 0;

    totalAtendimentos += r.atendimentos;
    totalHE += r.he75a + r.he100b + r.he75c + r.he100d;
    totalSobreaviso += sobreaviso;

    sums.sobreaviso += sobreaviso;
    sums.he75a += r.he75a;
    sums.he100b += r.he100b;
    sums.he75c += r.he75c;
    sums.he100d += r.he100d;
    sums.atendimentos += r.atendimentos;
  });

  // Grupos de horas extras (eixo do gráfico) — cada barra é uma categoria de
  // HE, com segmentos empilhados coloridos por colaboradora, no mesmo
  // formato do gráfico "Resumo semanal de horas" da Escala do mês.
  const heGroups: { key: string; shortLabel: string; values: Record<string, number>; total: number }[] = [
    { key: 'he75a', shortLabel: '75% (a)', values: {}, total: sums.he75a },
    { key: 'he100b', shortLabel: '100% (b)', values: {}, total: sums.he100b },
    { key: 'he75c', shortLabel: '75% c/AN (c)', values: {}, total: sums.he75c },
    { key: 'he100d', shortLabel: '100% c/AN (d)', values: {}, total: sums.he100d },
  ];
  relevantCollabs.forEach((c) => {
    const r = heMap[c.id] || { he75a: 0, he100b: 0, he75c: 0, he100d: 0, atendimentos: 0 };
    heGroups[0].values[c.id] = r.he75a;
    heGroups[1].values[c.id] = r.he100b;
    heGroups[2].values[c.id] = r.he75c;
    heGroups[3].values[c.id] = r.he100d;
  });

  const collabFilterOptions: SelectOption[] = [
    { value: '', label: 'Todas as colaboradoras', icon: <Users className="w-3.5 h-3.5 text-neutral-400" /> },
    ...collaborators.map((c) => ({
      value: c.id,
      label: `${c.name} ${c.matricula ? `(Mat. ${c.matricula})` : ''}`,
      color: c.color,
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-5 shadow-xs flex items-end justify-center gap-3.5 flex-wrap hover:border-black/20 transition-all">
        <div className="flex flex-col gap-1.5 min-w-[260px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-center">
            Filtrar por Colaborador
          </label>
          <CustomSelect
            options={collabFilterOptions}
            value={filterCollab}
            onChange={setFilterCollab}
            placeholder="Todas as colaboradoras"
          />
        </div>

        {filterCollab && (
          <button
            type="button"
            onClick={() => setFilterCollab('')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-black/10 text-xs font-medium text-neutral-600 hover:bg-[#f4f4f1] transition-colors cursor-pointer"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Limpar filtro</span>
          </button>
        )}
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-medium text-neutral-500">Atendimentos no mês</span>
            <div className="w-9 h-9 rounded-2xl bg-[#319685]/15 text-[#084F42] flex items-center justify-center shadow-2xs shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-neutral-900 tracking-tight tabular-nums">
              {totalAtendimentos}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 text-center">
              Demandas consideradas no cálculo
            </div>
          </div>
        </div>

        <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-medium text-neutral-500">Horas extras totais</span>
            <div className="w-9 h-9 rounded-2xl bg-[#EE7870]/20 text-[#E84A4E] flex items-center justify-center shadow-2xs shrink-0">
              <Sigma className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-neutral-900 tracking-tight tabular-nums">
              {fmtHours(totalHE)}h
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 text-center">
              Soma de HE 75% e HE 100%
            </div>
          </div>
        </div>

        <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-medium text-neutral-500">Horas de sobreaviso</span>
            <div className="w-9 h-9 rounded-2xl bg-[#6BC0B2]/20 text-[#319685] flex items-center justify-center shadow-2xs shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-neutral-900 tracking-tight tabular-nums">
              {fmtHours(totalSobreaviso)}h
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 text-center">
              Turnos de plantão no mês
            </div>
          </div>
        </div>
      </div>

      {/* Horas extras por colaboradora */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs hover:border-black/20 transition-all">
        <div className="mb-4 text-center">
          <h2 className="text-sm font-bold text-neutral-900">Horas extras por colaboradora</h2>
          <p className="text-xs text-neutral-400">
            Calculado a partir dos horários de início e fim de cada atendimento (chamado) registrado no mês
          </p>
        </div>

        <div className="h-56 sm:h-64 w-full">
          <SvgHEStackedChart groups={heGroups} collabs={relevantCollabs} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2.5 mt-1 border-t border-black/5">
          {relevantCollabs.map((c) => {
            const r = heMap[c.id] || { he75a: 0, he100b: 0, he75c: 0, he100d: 0, atendimentos: 0 };
            const totalPersonHE = r.he75a + r.he100b + r.he75c + r.he100d;
            return (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100/80"
                style={{ color: c.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}: {fmtHours(totalPersonHE)}h
              </span>
            );
          })}
        </div>
      </div>

      {/* Como os valores são calculados Legend */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs space-y-3 hover:border-black/20 transition-all">
        <div className="flex items-center justify-center gap-2 text-center">
          <Info className="w-4 h-4 text-[#2a78d6] shrink-0" />
          <h2 className="text-sm font-bold text-neutral-900">Como os valores são calculados</h2>
        </div>
        <p className="text-xs text-neutral-400 text-center">
          Referência das colunas da planilha &quot;Informações de horas de sobreaviso e horas extras&quot;
        </p>

        <ul className="space-y-2.5 text-xs text-neutral-600 pt-1">
          <li className="flex gap-2">
            <b className="text-neutral-900 shrink-0">Qtde de horas:</b>
            <span>Total de horas de sobreaviso (plantão) atribuídas no mês, independente de haver chamados.</span>
          </li>
          <li className="flex gap-2">
            <b className="text-neutral-900 shrink-0">(a) HE 75%:</b>
            <span>Horas extras em dia útil (segunda a sábado), fora da janela de adicional noturno (05:00 às 22:00).</span>
          </li>
          <li className="flex gap-2">
            <b className="text-neutral-900 shrink-0">(b) HE 100%:</b>
            <span>Horas extras realizadas em domingo, fora da janela de adicional noturno (05:00 às 22:00).</span>
          </li>
          <li className="flex gap-2">
            <b className="text-neutral-900 shrink-0">(c) HE 75% c/A.N:</b>
            <span>Horas extras em dia útil dentro da janela de adicional noturno (22:00 às 05:00).</span>
          </li>
          <li className="flex gap-2">
            <b className="text-neutral-900 shrink-0">(d) HE 100% c/A.N:</b>
            <span>Horas extras em domingo dentro da janela de adicional noturno (22:00 às 05:00).</span>
          </li>
        </ul>

        <div className="mt-4 pt-3 border-t border-black/5 flex items-start gap-2.5 text-[11px] text-amber-700 bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/60">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <b>Observação:</b> Sábado é considerado dia útil para fins deste cálculo. Valores de exemplo — antes de processar em folha de pagamento, valide feriados municipais/nacionais, banco de horas e acordos sindicais com o setor de RH/jurídico.
          </span>
        </div>
      </div>
    </div>
  );
};

// Gráfico de barras empilhadas por categoria de hora extra (uma barra por
// categoria HE, segmentos coloridos por colaboradora) — mesmo estilo visual
// do gráfico "Resumo semanal de horas" da Escala do mês.
const SvgHEStackedChart: React.FC<{
  groups: { key: string; shortLabel: string; values: Record<string, number>; total: number }[];
  collabs: Collaborator[];
}> = ({ groups, collabs }) => {
  const W = 640;
  const H = 240;
  const padL = 34;
  const padB = 26;
  const padT = 15;
  const padR = 10;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxTotal = Math.max(4, Math.ceil((Math.max(...groups.map((g) => g.total), 4) * 1.1) / 4) * 4);
  const n = groups.length;
  const slot = innerW / Math.max(n, 1);
  const barW = Math.min(56, slot * 0.5);

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

      {groups.map((g, i) => {
        const x = padL + slot * i + (slot - barW) / 2;
        let yCursor = padT + innerH;

        return (
          <g key={g.key}>
            {collabs.map((c) => {
              const v = g.values[c.id] || 0;
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
                  <title>{`${c.name} — HE ${g.shortLabel}: ${v}h`}</title>
                </rect>
              );
            })}
            <text
              x={x + barW / 2}
              y={padT + innerH + 18}
              fontSize="11"
              fontWeight="500"
              fill="#52514e"
              textAnchor="middle"
            >
              {g.shortLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

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
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-5 shadow-xs flex items-end gap-3.5 flex-wrap hover:border-black/20 transition-all">
        <div className="flex flex-col gap-1.5 min-w-[260px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
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
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Atendimentos no mês</span>
            <div className="w-9 h-9 rounded-2xl bg-[#319685]/15 text-[#084F42] flex items-center justify-center shadow-2xs">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-neutral-900 tracking-tight tabular-nums">
              {totalAtendimentos}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Demandas consideradas no cálculo
            </div>
          </div>
        </div>

        <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Horas extras totais</span>
            <div className="w-9 h-9 rounded-2xl bg-[#EE7870]/20 text-[#E84A4E] flex items-center justify-center shadow-2xs">
              <Sigma className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-neutral-900 tracking-tight tabular-nums">
              {fmtHours(totalHE)}h
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Soma de HE 75% e HE 100%
            </div>
          </div>
        </div>

        <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Horas de sobreaviso</span>
            <div className="w-9 h-9 rounded-2xl bg-[#6BC0B2]/20 text-[#319685] flex items-center justify-center shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-neutral-900 tracking-tight tabular-nums">
              {fmtHours(totalSobreaviso)}h
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Turnos de plantão no mês
            </div>
          </div>
        </div>
      </div>

      {/* Horas extras por colaboradora Table */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs overflow-x-auto hover:border-black/20 transition-all">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-neutral-900">Horas extras por colaboradora</h2>
          <p className="text-xs text-neutral-400">
            Calculado a partir dos horários de início e fim de cada atendimento (chamado) registrado no mês
          </p>
        </div>

        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-black/10 text-neutral-400 text-[11px] font-semibold">
              <th className="py-2.5 px-3">Funcionário</th>
              <th className="py-2.5 px-3">Matrícula</th>
              <th className="py-2.5 px-3">Qtde de horas</th>
              <th className="py-2.5 px-3">HE 75% (a)</th>
              <th className="py-2.5 px-3">HE 100% (b)</th>
              <th className="py-2.5 px-3">HE 75% c/A.N (c)</th>
              <th className="py-2.5 px-3">HE 100% c/A.N (d)</th>
              <th className="py-2.5 px-3 font-bold text-neutral-700">Atendimentos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 tabular-nums">
            {relevantCollabs.map((c) => {
              const r = heMap[c.id] || { he75a: 0, he100b: 0, he75c: 0, he100d: 0, atendimentos: 0 };
              const sobreaviso = totalsByCollab[c.id] || 0;

              return (
                <tr key={c.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-bold text-neutral-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-neutral-500">{c.matricula || '-'}</td>
                  <td className="py-3 px-3 text-neutral-800 font-medium">{fmtHours(sobreaviso)}h</td>
                  <td className="py-3 px-3 text-neutral-800">{fmtHours(r.he75a)}h</td>
                  <td className="py-3 px-3 text-neutral-800">{fmtHours(r.he100b)}h</td>
                  <td className="py-3 px-3 text-neutral-800">{fmtHours(r.he75c)}h</td>
                  <td className="py-3 px-3 text-neutral-800">{fmtHours(r.he100d)}h</td>
                  <td className="py-3 px-3 font-bold text-neutral-900">{r.atendimentos}</td>
                </tr>
              );
            })}
          </tbody>

          {relevantCollabs.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-black/10 font-bold text-neutral-900 bg-neutral-50/40 tabular-nums">
                <td className="py-3 px-3">Total Geral</td>
                <td className="py-3 px-3 text-neutral-400">-</td>
                <td className="py-3 px-3">{fmtHours(sums.sobreaviso)}h</td>
                <td className="py-3 px-3">{fmtHours(sums.he75a)}h</td>
                <td className="py-3 px-3">{fmtHours(sums.he100b)}h</td>
                <td className="py-3 px-3">{fmtHours(sums.he75c)}h</td>
                <td className="py-3 px-3">{fmtHours(sums.he100d)}h</td>
                <td className="py-3 px-3">{sums.atendimentos}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Como os valores são calculados Legend */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs space-y-3 hover:border-black/20 transition-all">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#2a78d6]" />
          <h2 className="text-sm font-bold text-neutral-900">Como os valores são calculados</h2>
        </div>
        <p className="text-xs text-neutral-400">
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

import React from 'react';
import { Collaborator, DemandType, CallRecord, DaySchedule } from '../types';
import { fmtHours, pad, monthLabel } from '../utils/calc';
import {
  Clock,
  Users,
  TrendingUp,
  Phone,
  PhoneCall,
  ArrowRight,
  CheckCircle2,
  Clock4,
  Plus,
  BarChart3,
  PieChart,
} from 'lucide-react';

interface DashboardViewProps {
  collaborators: Collaborator[];
  demandTypes: DemandType[];
  calls: CallRecord[];
  schedule: DaySchedule[];
  currentYear: number;
  currentMonth: number;
  onNavigateToCalls: () => void;
  onOpenNewCallModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  collaborators,
  demandTypes,
  calls,
  schedule,
  currentYear,
  currentMonth,
  onNavigateToCalls,
  onOpenNewCallModal,
}) => {
  // Calculations
  const activeCollabs = collaborators.filter((c) => c.status === 'ativo');
  const inactiveCount = collaborators.length - activeCollabs.length;

  const totalsByCollab: Record<string, number> = {};
  collaborators.forEach((c) => {
    totalsByCollab[c.id] = 0;
  });
  schedule.forEach((d) => {
    if (d.collaboratorId && totalsByCollab[d.collaboratorId] !== undefined) {
      totalsByCollab[d.collaboratorId] += d.hours;
    }
  });

  const shiftsCountByCollab: Record<string, number> = {};
  collaborators.forEach((c) => {
    shiftsCountByCollab[c.id] = 0;
  });
  schedule.forEach((d) => {
    if (d.collaboratorId && shiftsCountByCollab[d.collaboratorId] !== undefined) {
      shiftsCountByCollab[d.collaboratorId] += 1;
    }
  });

  const totalMonthlyHours = schedule.reduce((sum, d) => sum + d.hours, 0);

  // Colaboradora com mais horas
  const topCollab = activeCollabs
    .slice()
    .sort((a, b) => (totalsByCollab[b.id] || 0) - (totalsByCollab[a.id] || 0))[0];

  // Proximo turno
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === currentYear && now.getMonth() === currentMonth;
  const todayDay = isCurrentMonth ? now.getDate() : 1;
  const upcomingShift = schedule.find((d) => d.day >= todayDay && d.collaboratorId) || schedule[0];
  const upcomingCollab = upcomingShift
    ? collaborators.find((c) => c.id === upcomingShift.collaboratorId)
    : null;

  const pendingCallsCount = calls.filter((c) => c.status === 'pendente').length;
  const completedCallsCount = calls.filter((c) => c.status === 'concluido').length;
  const completionRate = calls.length > 0 ? Math.round((completedCallsCount / calls.length) * 100) : 0;

  // Turnos por tipo
  const turnosPorTipo = {
    semana: schedule.filter((d) => d.kind === 'semana').reduce((s, d) => s + d.hours, 0),
    fim_de_semana: schedule.filter((d) => d.kind === 'fim_de_semana').reduce((s, d) => s + d.hours, 0),
    apoio: schedule.filter((d) => d.kind === 'apoio').reduce((s, d) => s + d.hours, 0),
  };

  // Semanas - Horas
  const weekIndexes = Array.from(new Set(schedule.map((d) => d.weekIndex))).sort(
    (a: number, b: number) => a - b
  );
  const weeksSummary = weekIndexes.map((wi) => {
    const daysInWeek = schedule.filter((d) => d.weekIndex === wi);
    const totals: Record<string, number> = {};
    collaborators.forEach((c) => {
      totals[c.id] = 0;
    });
    daysInWeek.forEach((d) => {
      if (d.collaboratorId) {
        totals[d.collaboratorId] = (totals[d.collaboratorId] || 0) + d.hours;
      }
    });
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    return { weekIndex: wi, totals, total };
  });

  // Semanas - Demandas
  const weeklyCallsSummary = weekIndexes.map((wi) => {
    const daysInWeek = schedule.filter((d) => d.weekIndex === wi).map((d) => d.day);
    let count = 0;
    calls.forEach((c) => {
      if (daysInWeek.includes(c.day)) count++;
    });
    return { weekIndex: wi, count };
  });

  // Demandas por tipo (dinâmico com qualquer nova tag criada)
  const demandCounts: Record<string, number> = {};
  demandTypes.forEach((d) => {
    demandCounts[d.id] = 0;
  });
  calls.forEach((c) => {
    demandCounts[c.demandTypeId] = (demandCounts[c.demandTypeId] || 0) + 1;
  });

  // Demandas por colaboradora (dinâmico)
  const callsByCollab: Record<string, number> = {};
  collaborators.forEach((c) => {
    callsByCollab[c.id] = 0;
  });
  calls.forEach((c) => {
    if (c.collaboratorId) {
      callsByCollab[c.collaboratorId] = (callsByCollab[c.collaboratorId] || 0) + 1;
    }
  });

  // Recent calls
  const recentCalls = calls
    .slice()
    .sort((a, b) => b.day - a.day)
    .slice(0, 6);

  return (
    <div className="space-y-7">
      {/* 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Horas sobreaviso</span>
            <div className="w-9 h-9 rounded-2xl bg-[#319685]/15 text-[#084F42] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-neutral-900 tracking-tight tabular-nums">
              {fmtHours(totalMonthlyHours)}h
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {schedule.length} dias em {monthLabel(currentMonth, currentYear)}
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Colaboradores ativos</span>
            <div className="w-9 h-9 rounded-2xl bg-[#6BC0B2]/20 text-[#084F42] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-neutral-900 tracking-tight tabular-nums">
              {activeCollabs.length}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {inactiveCount} em licença
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Mais horas no mês</span>
            <div className="w-9 h-9 rounded-2xl bg-[#EE7870]/20 text-[#E84A4E] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-neutral-900 tracking-tight truncate">
              {topCollab?.name || '-'}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {topCollab ? `${fmtHours(totalsByCollab[topCollab.id] || 0)}h no mês` : '-'}
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Próximo plantão</span>
            <div className="w-9 h-9 rounded-2xl bg-[#DEEDE0] text-[#084F42] flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-neutral-900 tracking-tight truncate">
              {upcomingShift ? `Dia ${upcomingShift.day} · ${upcomingShift.start}` : '-'}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5 truncate">
              {upcomingCollab?.name || '-'}
            </div>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">Total de Demandas</span>
            <div className="w-9 h-9 rounded-2xl bg-[#9AD0BE]/25 text-[#084F42] flex items-center justify-center">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-neutral-900 tracking-tight tabular-nums">
              {calls.length}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {completionRate}% concluídas ({completedCallsCount}/{calls.length})
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: PAINEL ANALÍTICO COMPLETO DE DEMANDAS E ATENDIMENTOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#319685]" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
              Painel Geral de Demandas e Atendimentos
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenNewCallModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Cadastrar Demanda</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico 1: Distribuição por Tipo de Demanda */}
          <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-neutral-900">Distribuição por Tipo de Demanda</h3>
                <BarChart3 className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-xs text-neutral-400">Quantidade de registros por categoria</p>
            </div>

            <div className="h-56 w-full my-2">
              <SvgDemandChart demandTypes={demandTypes} counts={demandCounts} compact />
            </div>

            <div className="text-[11px] text-neutral-500 text-center font-medium pt-2.5 border-t border-black/5">
              {calls.length} atendimentos registrados neste mês
            </div>
          </div>

          {/* Gráfico 2: Atendimentos por Colaboradora */}
          <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-neutral-900">Atendimentos por Colaboradora</h3>
                <Users className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-xs text-neutral-400">Carga de chamados atendidos por pessoa</p>
            </div>

            <div className="h-56 w-full my-2">
              <SvgCollabCallsChart activeCollabs={activeCollabs} callsByCollab={callsByCollab} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2.5 border-t border-black/5">
              {activeCollabs.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100/80"
                  style={{ color: c.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}: {callsByCollab[c.id] || 0}
                </span>
              ))}
            </div>
          </div>

          {/* Gráfico 3: Status dos Atendimentos & Evolução Semanal */}
          <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-neutral-900">Status dos Atendimentos</h3>
                <PieChart className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-xs text-neutral-400">Concluídos vs Pendentes no período</p>
            </div>

            <div className="my-auto py-2 space-y-4">
              <div className="flex items-center justify-around">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 font-bold text-lg border border-emerald-200/50 shadow-2xs">
                    {completedCallsCount}
                  </div>
                  <div className="text-xs font-bold text-emerald-700">Concluídos</div>
                  <div className="text-[11px] text-neutral-400">{completionRate}%</div>
                </div>

                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1.5 font-bold text-lg border border-amber-200/50 shadow-2xs">
                    {pendingCallsCount}
                  </div>
                  <div className="text-xs font-bold text-amber-700">Pendentes</div>
                  <div className="text-[11px] text-neutral-400">
                    {calls.length > 0 ? 100 - completionRate : 0}%
                  </div>
                </div>
              </div>

              {/* Weekly Trend Mini Bar */}
              <div className="bg-neutral-50/80 rounded-2xl p-3.5 border border-black/5 space-y-2">
                <div className="text-[11px] font-bold text-neutral-600">
                  Evolução de chamados por semana:
                </div>
                <div className="flex items-end justify-between gap-2 h-12 pt-1">
                  {weeklyCallsSummary.map((w) => {
                    const maxCall = Math.max(...weeklyCallsSummary.map((x) => x.count), 1);
                    const barH = (w.count / maxCall) * 36;
                    return (
                      <div key={w.weekIndex} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-[#319685] rounded-t-lg transition-all"
                          style={{ height: `${Math.max(barH, 6)}px` }}
                        />
                        <span className="text-[10px] text-neutral-500 font-bold">
                          S{w.weekIndex}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onNavigateToCalls}
              className="w-full py-2.5 rounded-2xl border border-black/10 hover:bg-neutral-100 text-xs font-semibold text-neutral-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Ver tabela completa de demandas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: ESCALA E HORAS DE SOBREAVISO */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#084F42]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
            Escalas e Horas de Sobreaviso
          </h2>
        </div>

        {/* Row: Bar Chart Horas por Colaboradora + Donut Chart Tipo de Turno */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bar Chart (2 cols) */}
          <div className="lg:col-span-2 bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs hover:border-black/20 transition-all">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-neutral-900">Horas de Sobreaviso por Colaboradora</h3>
              <p className="text-xs text-neutral-400">Total acumulado no mês (colaboradoras ativas)</p>
            </div>

            <div className="h-64 w-full">
              <SvgBarChart activeCollabs={activeCollabs} totalsByCollab={totalsByCollab} />
            </div>
          </div>

          {/* Donut Chart (1 col) */}
          <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-black/20 transition-all">
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Distribuição por Tipo de Turno</h3>
              <p className="text-xs text-neutral-400">Semana, fim de semana e apoio</p>
            </div>

            <div className="my-3 flex justify-center">
              <SvgDonutChart turnos={turnosPorTipo} totalHours={totalMonthlyHours} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2.5 border-t border-black/5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#084F42]/10 text-[#084F42]">
                <span className="w-2 h-2 rounded-full bg-[#084F42]" />
                Semana ({fmtHours(turnosPorTipo.semana)}h)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#319685]/15 text-[#319685]">
                <span className="w-2 h-2 rounded-full bg-[#319685]" />
                Fim de semana ({fmtHours(turnosPorTipo.fim_de_semana)}h)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#E84A4E]/10 text-[#E84A4E]">
                <span className="w-2 h-2 rounded-full bg-[#E84A4E]" />
                Apoio ({fmtHours(turnosPorTipo.apoio)}h)
              </span>
            </div>
          </div>
        </div>

        {/* Row: Evolução semanal de horas + Plantões no mês */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stacked Bar (2 cols) */}
          <div className="lg:col-span-2 bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs hover:border-black/20 transition-all">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-neutral-900">Evolução Semanal de Horas</h3>
              <p className="text-xs text-neutral-400">Horas de sobreaviso por semana e colaboradora</p>
            </div>

            <div className="h-64 w-full">
              <SvgStackedWeeksChart weeks={weeksSummary} activeCollabs={activeCollabs} />
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-black/5">
              {activeCollabs.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${c.color}15`, color: c.color }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Plantões no mês (1 col) */}
          <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col hover:border-black/20 transition-all">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-neutral-900">Plantões no Mês</h3>
              <p className="text-xs text-neutral-400">Quantidade de turnos atribuídos</p>
            </div>

            <div className="divide-y divide-black/5 my-auto">
              {activeCollabs.map((c) => {
                const shifts = shiftsCountByCollab[c.id] || 0;
                return (
                  <div key={c.id} className="flex items-center justify-between py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${c.color}18`, color: c.color }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </span>
                    <span className="text-xs font-bold text-neutral-800 tabular-nums">
                      {shifts} turnos
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: TABELA DE ÚLTIMAS DEMANDAS */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs overflow-x-auto hover:border-black/20 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Últimas Demandas Registradas</h3>
            <p className="text-xs text-neutral-400">Histórico recente de solicitações atendidas</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenNewCallModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Registro</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToCalls}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#319685] hover:underline cursor-pointer"
            >
              <span>Ver todas as demandas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {recentCalls.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Nenhuma demanda registrada ainda neste mês.
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-black/10 text-neutral-400 text-[11px] font-semibold">
                <th className="py-2.5 px-3">Dia</th>
                <th className="py-2.5 px-3">Colaborador</th>
                <th className="py-2.5 px-3">Demanda</th>
                <th className="py-2.5 px-3">Contato</th>
                <th className="py-2.5 px-3">Beneficiário</th>
                <th className="py-2.5 px-3">Horário</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {recentCalls.map((call) => {
                const collab = collaborators.find((c) => c.id === call.collaboratorId);
                const demand = demandTypes.find((d) => d.id === call.demandTypeId);
                return (
                  <tr key={call.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3 font-bold text-neutral-800 tabular-nums">
                      {pad(call.day)}/{pad(currentMonth + 1)}
                    </td>
                    <td className="py-3 px-3">
                      {collab ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: `${collab.color}18`, color: collab.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: collab.color }} />
                          {collab.name}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {demand ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: `${demand.color}18`, color: demand.color }}
                        >
                          {demand.label}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-3 text-neutral-600 truncate max-w-[130px]">
                      {call.contato || '-'}
                    </td>
                    <td className="py-3 px-3 text-neutral-600 truncate max-w-[130px]">
                      {call.beneficiario || '-'}
                    </td>
                    <td className="py-3 px-3 text-neutral-600 tabular-nums">
                      {call.inicio && call.fim ? `${call.inicio} - ${call.fim}` : '-'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          call.status === 'concluido'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {call.status === 'concluido' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <Clock4 className="w-3 h-3" />
                        )}
                        {call.status === 'concluido' ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// SVG Sub-charts
const SvgBarChart: React.FC<{
  activeCollabs: Collaborator[];
  totalsByCollab: Record<string, number>;
}> = ({ activeCollabs, totalsByCollab }) => {
  const W = 640;
  const H = 240;
  const padL = 40;
  const padB = 30;
  const padT = 15;
  const padR = 15;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const values = activeCollabs.map((c) => totalsByCollab[c.id] || 0);
  const maxVal = Math.max(10, Math.ceil((Math.max(...values, 10) * 1.15) / 10) * 10);
  const n = activeCollabs.length;
  const slot = innerW / Math.max(n, 1);
  const barW = Math.min(48, slot * 0.5);

  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {gridLevels.map((frac, i) => {
        const val = Math.round(maxVal * frac);
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

      {activeCollabs.map((c, i) => {
        const v = totalsByCollab[c.id] || 0;
        const barH = innerH * (v / maxVal);
        const x = padL + slot * i + (slot - barW) / 2;
        const y = padT + innerH - barH;
        return (
          <g key={c.id}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(barH, 0)}
              rx={6}
              fill={c.color}
              className="transition-all hover:opacity-85"
            >
              <title>{`${c.name}: ${fmtHours(v)}h`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={padT + innerH + 18}
              fontSize="12"
              fontWeight="500"
              fill="#52514e"
              textAnchor="middle"
            >
              {c.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const SvgCollabCallsChart: React.FC<{
  activeCollabs: Collaborator[];
  callsByCollab: Record<string, number>;
}> = ({ activeCollabs, callsByCollab }) => {
  const W = 320;
  const H = 200;
  const padL = 30;
  const padB = 30;
  const padT = 15;
  const padR = 10;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const values = activeCollabs.map((c) => callsByCollab[c.id] || 0);
  const maxVal = Math.max(...values, 1);
  const niceMax = Math.max(4, maxVal + (4 - (maxVal % 4 || 4)));
  const n = activeCollabs.length;
  const slot = innerW / Math.max(n, 1);
  const barW = Math.min(32, slot * 0.6);

  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {gridLevels.map((frac, i) => {
        const val = Math.round(niceMax * frac);
        const y = padT + innerH - innerH * frac;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e5e0" strokeWidth="1" />
            <text x={padL - 6} y={y + 4} fontSize="10" fill="#898781" textAnchor="end">
              {val}
            </text>
          </g>
        );
      })}

      {activeCollabs.map((c, i) => {
        const v = callsByCollab[c.id] || 0;
        const barH = innerH * (v / niceMax);
        const x = padL + slot * i + (slot - barW) / 2;
        const y = padT + innerH - barH;
        return (
          <g key={c.id}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(barH, 0)}
              rx={4}
              fill={c.color}
              className="transition-all hover:opacity-85"
            >
              <title>{`${c.name}: ${v} chamados`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={padT + innerH + 16}
              fontSize="10"
              fontWeight="500"
              fill="#52514e"
              textAnchor="middle"
            >
              {c.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const SvgDonutChart: React.FC<{
  turnos: { semana: number; fim_de_semana: number; apoio: number };
  totalHours: number;
}> = ({ turnos, totalHours }) => {
  const cx = 110;
  const cy = 110;
  const rOuter = 85;
  const rInner = 55;
  const gap = 2.5;

  const segments = [
    { key: 'semana', label: 'Semana', value: turnos.semana, color: '#4a3aa7' },
    { key: 'fim_de_semana', label: 'Fim de semana', value: turnos.fim_de_semana, color: '#008300' },
    { key: 'apoio', label: 'Apoio', value: turnos.apoio, color: '#e34948' },
  ];

  let angle = 0;

  function polar(r: number, angleDeg: number) {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function arcPath(rOut: number, rIn: number, startAngle: number, endAngle: number) {
    const p1 = polar(rOut, endAngle);
    const p2 = polar(rOut, startAngle);
    const p3 = polar(rIn, startAngle);
    const p4 = polar(rIn, endAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${p1.x} ${p1.y} A ${rOut} ${rOut} 0 ${largeArc} 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rIn} ${rIn} 0 ${largeArc} 1 ${p4.x} ${p4.y} Z`;
  }

  return (
    <svg viewBox="0 0 220 220" className="w-48 h-48">
      {segments.map((seg) => {
        const frac = totalHours ? seg.value / totalHours : 0;
        const sweep = frac * 360;
        const start = angle + gap / 2;
        const end = angle + sweep - gap / 2;
        angle += sweep;

        if (sweep <= 1) return null;
        return (
          <path
            key={seg.key}
            d={arcPath(rOuter, rInner, start, end)}
            fill={seg.color}
            className="transition-all hover:opacity-90 cursor-pointer"
          >
            <title>{`${seg.label}: ${fmtHours(seg.value)}h (${Math.round(frac * 100)}%)`}</title>
          </path>
        );
      })}
      <text
        x={cx}
        y={cy - 2}
        fontSize="18"
        fontWeight="700"
        fill="#0b0b0b"
        textAnchor="middle"
      >
        {fmtHours(totalHours)}h
      </text>
      <text
        x={cx}
        y={cy + 16}
        fontSize="11"
        fontWeight="500"
        fill="#898781"
        textAnchor="middle"
      >
        no mês
      </text>
    </svg>
  );
};

const SvgStackedWeeksChart: React.FC<{
  weeks: { weekIndex: number; totals: Record<string, number>; total: number }[];
  activeCollabs: Collaborator[];
}> = ({ weeks, activeCollabs }) => {
  const W = 640;
  const H = 240;
  const padL = 40;
  const padB = 30;
  const padT = 15;
  const padR = 15;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxTotal = Math.max(10, Math.ceil((Math.max(...weeks.map((w) => w.total), 10) * 1.1) / 10) * 10);
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
              const v = w.totals[c.id] || 0;
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
                  <title>{`${c.name} — Semana ${w.weekIndex}: ${fmtHours(v)}h`}</title>
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

export const SvgDemandChart: React.FC<{
  demandTypes: DemandType[];
  counts: Record<string, number>;
  compact?: boolean;
}> = ({ demandTypes, counts, compact = false }) => {
  const items = demandTypes
    .map((d) => ({ label: d.label, value: counts[d.id] || 0, color: d.color }))
    .filter((it) => it.value > 0);

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-xs text-neutral-400">
        Nenhuma demanda registrada
      </div>
    );
  }

  const W = compact ? 320 : 640;
  const H = compact ? 200 : 220;
  const padL = 30;
  const padB = 30;
  const padT = 15;
  const padR = 10;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const maxVal = Math.max(...items.map((i) => i.value), 1);
  const niceMax = Math.max(4, maxVal + (4 - (maxVal % 4 || 4)));
  const n = items.length;
  const slot = innerW / n;
  const barW = Math.min(compact ? 24 : 44, slot * 0.55);

  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
      {gridLevels.map((frac, i) => {
        const val = Math.round(niceMax * frac);
        const y = padT + innerH - innerH * frac;
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e5e5e0" strokeWidth="1" />
            <text x={padL - 6} y={y + 4} fontSize="10" fill="#898781" textAnchor="end">
              {val}
            </text>
          </g>
        );
      })}

      {items.map((it, i) => {
        const barH = innerH * (it.value / niceMax);
        const x = padL + slot * i + (slot - barW) / 2;
        const y = padT + innerH - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(barH, 0)}
              rx={4}
              fill={it.color}
              className="transition-all hover:opacity-85"
            >
              <title>{`${it.label}: ${it.value}`}</title>
            </rect>
            <text
              x={x + barW / 2}
              y={padT + innerH + 16}
              fontSize={compact ? '9' : '11'}
              fontWeight="500"
              fill="#898781"
              textAnchor="middle"
            >
              {it.label.length > (compact ? 7 : 12)
                ? `${it.label.slice(0, compact ? 6 : 10)}…`
                : it.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

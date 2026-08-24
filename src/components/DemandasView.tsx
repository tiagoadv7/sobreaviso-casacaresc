import React, { useState } from 'react';
import { Collaborator, DemandType, CallRecord } from '../types';
import { pad, computeDurationText } from '../utils/calc';
import { WEEKDAY_LABELS } from '../utils/constants';
import {
  PhoneCall,
  FilterX,
  Pencil,
  Trash2,
  Plus,
  Search,
  Users,
  Tag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';
import { useAuth } from '../auth/AuthContext';

interface DemandasViewProps {
  collaborators: Collaborator[];
  demandTypes: DemandType[];
  calls: CallRecord[];
  currentYear: number;
  currentMonth: number;
  onOpenCallModal: (callId?: string) => void;
  onDeleteCall: (callId: string) => void;
}

export const DemandasView: React.FC<DemandasViewProps> = ({
  collaborators,
  demandTypes,
  calls,
  currentYear,
  currentMonth,
  onOpenCallModal,
  onDeleteCall,
}) => {
  const { isAdmin, session } = useAuth();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCollab, setFilterCollab] = useState<string>('');
  const [filterDemand, setFilterDemand] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Filtered calls
  const filteredCalls = calls.filter((c) => {
    if (filterCollab && c.collaboratorId !== filterCollab) return false;
    if (filterDemand && c.demandTypeId !== filterDemand) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchContact = c.contato?.toLowerCase().includes(q);
      const matchBeneficiary = c.beneficiario?.toLowerCase().includes(q);
      const matchReason = c.motivo?.toLowerCase().includes(q);
      const matchNote = c.observacao?.toLowerCase().includes(q);
      if (!matchContact && !matchBeneficiary && !matchReason && !matchNote) return false;
    }
    return true;
  });

  const isFiltered =
    filterCollab !== '' || filterDemand !== '' || filterStatus !== '' || searchTerm !== '';

  const totalCalls = filteredCalls.length;
  const concluidosCount = filteredCalls.filter((c) => c.status === 'concluido').length;
  const pendentesCount = totalCalls - concluidosCount;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCollab('');
    setFilterDemand('');
    setFilterStatus('');
  };

  const collabFilterOptions: SelectOption[] = [
    { value: '', label: 'Todas as colaboradoras', icon: <Users className="w-3.5 h-3.5 text-neutral-400" /> },
    ...collaborators.map((c) => ({
      value: c.id,
      label: c.name,
      color: c.color,
    })),
  ];

  const demandFilterOptions: SelectOption[] = [
    { value: '', label: 'Todas as demandas', icon: <Tag className="w-3.5 h-3.5 text-neutral-400" /> },
    ...demandTypes.map((d) => ({
      value: d.id,
      label: d.label,
      color: d.color,
    })),
  ];

  const statusFilterOptions: SelectOption[] = [
    { value: '', label: 'Todos os status' },
    { value: 'concluido', label: 'Concluído', color: '#059669', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> },
    { value: 'pendente', label: 'Pendente', color: '#d97706', icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Top Registration Action Card */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col items-center gap-4 text-center hover:border-black/20 transition-all">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Cadastro e Histórico de Demandas
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Registre os chamados atendidos no sobreaviso. Os gráficos analíticos consolidados estão centralizados na aba <b>Dashboard</b>.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenCallModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold bg-[#319685] text-white hover:bg-[#084F42] shadow-md shadow-[#319685]/30 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Demanda</span>
        </button>
      </div>

      {/* Filter and Search Bar com Rounded Selects */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-5 shadow-xs flex items-end gap-3.5 flex-wrap hover:border-black/20 transition-all">
        {/* Search */}
        <div className="flex flex-col gap-1.5 w-full sm:flex-1 sm:min-w-[220px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-center">
            Buscar por nome / beneficiário
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Digite o contato, beneficiário ou motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 text-center focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
            />
          </div>
        </div>

        {/* Colaborador */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[190px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-center">
            Colaborador
          </label>
          <CustomSelect
            options={collabFilterOptions}
            value={filterCollab}
            onChange={setFilterCollab}
            placeholder="Todas as colaboradoras"
          />
        </div>

        {/* Demanda */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[190px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-center">
            Demanda
          </label>
          <CustomSelect
            options={demandFilterOptions}
            value={filterDemand}
            onChange={setFilterDemand}
            placeholder="Todas as demandas"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5 w-full sm:w-auto sm:min-w-[160px]">
          <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-center">
            Status
          </label>
          <CustomSelect
            options={statusFilterOptions}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Todos os status"
          />
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-black/10 text-xs font-medium text-neutral-600 hover:bg-[#f4f4f1] transition-colors cursor-pointer"
          >
            <FilterX className="w-3.5 h-3.5" />
            <span>Limpar filtros</span>
          </button>
        )}
      </div>

      {/* Summary Chips */}
      <div className="flex items-center justify-center flex-wrap gap-3 text-xs text-neutral-600 font-medium">
        <span className="bg-white px-3.5 py-1.5 rounded-2xl border border-black/10 shadow-2xs">
          Exibindo <b>{totalCalls}</b> demandas
        </span>
        <span className="bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-2xl border border-emerald-200 shadow-2xs">
          <b>{concluidosCount}</b> concluídas
        </span>
        <span className="bg-amber-50 text-amber-800 px-3.5 py-1.5 rounded-2xl border border-amber-200 shadow-2xs">
          <b>{pendentesCount}</b> pendentes
        </span>
      </div>

      {/* Registros de demandas Table */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs overflow-x-auto hover:border-black/20 transition-all">
        {filteredCalls.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400 space-y-3">
            <PhoneCall className="w-8 h-8 text-neutral-300 mx-auto" />
            <div>Nenhuma demanda encontrada para os critérios selecionados.</div>
            <button
              type="button"
              onClick={() => onOpenCallModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Demanda</span>
            </button>
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
                <th className="py-2.5 px-3">Motivo</th>
                <th className="py-2.5 px-3">Observação</th>
                <th className="py-2.5 px-3">Início</th>
                <th className="py-2.5 px-3">Fim</th>
                <th className="py-2.5 px-3">Duração</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredCalls
                .slice()
                .sort((a, b) => a.day - b.day)
                .map((call) => {
                  const collab = collaborators.find((c) => c.id === call.collaboratorId);
                  const demand = demandTypes.find((d) => d.id === call.demandTypeId);
                  const dateObj = new Date(currentYear, currentMonth, call.day);
                  const weekday = WEEKDAY_LABELS[dateObj.getDay()];
                  const duration = computeDurationText(call.inicio, call.fim);

                  return (
                    <tr key={call.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-neutral-800 tabular-nums">
                          {pad(call.day)}/{pad(currentMonth + 1)}
                        </div>
                        <div className="text-[10px] text-neutral-400">{weekday}</div>
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

                      <td className="py-3 px-3 text-neutral-700 truncate max-w-[120px]">
                        {call.contato || '-'}
                      </td>

                      <td className="py-3 px-3 text-neutral-700 truncate max-w-[120px]">
                        {call.beneficiario || '-'}
                      </td>

                      <td className="py-3 px-3 text-neutral-500 truncate max-w-[140px] italic">
                        {call.motivo || '-'}
                      </td>

                      <td className="py-3 px-3 text-neutral-500 truncate max-w-[140px] italic">
                        {call.observacao || '-'}
                      </td>

                      <td className="py-3 px-3 text-neutral-600 tabular-nums">
                        {call.inicio || '-'}
                      </td>

                      <td className="py-3 px-3 text-neutral-600 tabular-nums">
                        {call.fim || '-'}
                      </td>

                      <td className="py-3 px-3 font-semibold text-neutral-800 tabular-nums">
                        {duration}
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
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {call.status === 'concluido' ? 'Concluído' : 'Pendente'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {(isAdmin || call.collaboratorId === session?.collaboratorId) ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenCallModal(call.id)}
                              className="p-2 rounded-xl border border-black/10 hover:bg-neutral-100 text-neutral-600 transition-colors cursor-pointer"
                              title="Editar demanda"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteCall(call.id)}
                              className="p-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                              title="Excluir demanda"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-300">-</span>
                        )}
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

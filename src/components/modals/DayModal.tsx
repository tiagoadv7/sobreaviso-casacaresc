import React, { useState, useEffect } from 'react';
import { Collaborator, DaySchedule, CallRecord, DemandType } from '../../types';
import { MONTH_NAMES } from '../../utils/constants';
import {
  collaboratorStatusLabel,
  computeDurationHours,
  computeDurationText,
  defaultShiftHoursForKind,
  fmtHours,
  pad,
} from '../../utils/calc';
import { X, Plus, Trash2, User, ShieldCheck } from 'lucide-react';
import { CustomSelect, SelectOption } from '../CustomSelect';
import { TimeSelect } from '../TimeSelect';
import { useAuth } from '../../auth/AuthContext';

interface DayModalProps {
  isOpen: boolean;
  daySchedule: DaySchedule | null;
  collaborators: Collaborator[];
  demandTypes: DemandType[];
  calls: CallRecord[];
  currentMonth: number;
  onClose: () => void;
  onSaveDay: (updated: Partial<DaySchedule>) => void;
  onClearDay: () => void;
  onOpenNewCallForDay: (day: number, collaboratorId: string) => void;
  onDeleteCall: (callId: string) => void;
}

export const DayModal: React.FC<DayModalProps> = ({
  isOpen,
  daySchedule,
  collaborators,
  demandTypes,
  calls,
  currentMonth,
  onClose,
  onSaveDay,
  onClearDay,
  onOpenNewCallForDay,
  onDeleteCall,
}) => {
  const { isAdmin, session } = useAuth();
  const [collaboratorId, setCollaboratorId] = useState<string>('');
  const [start, setStart] = useState<string>('18:00');
  const [end, setEnd] = useState<string>('07:30');

  useEffect(() => {
    if (daySchedule) {
      setCollaboratorId(daySchedule.collaboratorId);
      if (daySchedule.start && daySchedule.end) {
        setStart(daySchedule.start);
        setEnd(daySchedule.end);
      } else {
        // Horário padrão sugerido para um dia ainda sem plantão definido —
        // o administrador pode alterar livremente antes de salvar.
        const defaults = defaultShiftHoursForKind(daySchedule.kind);
        setStart(defaults.start);
        setEnd(defaults.end);
      }
    }
  }, [daySchedule]);

  if (!isOpen || !daySchedule) return null;

  const currentCollab = collaborators.find((c) => c.id === collaboratorId);
  const dayCalls = calls.filter((c) => c.day === daySchedule.day);
  const calculatedHours = computeDurationHours(start, end);

  const kindLabel =
    daySchedule.kind === 'semana'
      ? 'Turno de semana'
      : daySchedule.kind === 'fim_de_semana'
      ? 'Turno de fim de semana'
      : 'Apoio de domingo';

  const collaboratorOptions: SelectOption[] = collaborators.map((c) => ({
    value: c.id,
    label: c.name,
    color: c.color,
    badge: c.status !== 'ativo' ? collaboratorStatusLabel(c) : undefined,
    icon: <User className="w-3.5 h-3.5 text-neutral-400" />,
  }));

  const handleSave = () => {
    onSaveDay({
      collaboratorId,
      start,
      end,
      hours: calculatedHours > 0 ? calculatedHours : daySchedule.hours,
      isCustom: true,
    });
    onClose();
  };

  const handleClear = () => {
    onClearDay();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl w-full max-w-md p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: currentCollab?.color || '#319685' }}
            />
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                {pad(daySchedule.day)} de {MONTH_NAMES[currentMonth]} · {daySchedule.weekdayLabel}
              </h3>
              <p className="text-xs text-neutral-400 font-medium">{kindLabel}</p>
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

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Colaborador com Rounded Custom Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              Colaborador de plantão {isAdmin ? '' : '(Apenas administrador pode alterar)'}
            </label>
            <CustomSelect
              options={collaboratorOptions}
              value={collaboratorId}
              disabled={!isAdmin}
              onChange={(val) => setCollaboratorId(val)}
              placeholder="Selecione a colaboradora"
            />
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Hora inicial
              </label>
              <TimeSelect value={start} disabled={!isAdmin} onChange={setStart} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Hora final
              </label>
              <TimeSelect value={end} disabled={!isAdmin} onChange={setEnd} />
            </div>
          </div>

          {/* Total card */}
          <div className="bg-[#f4f4f1] rounded-2xl p-3.5 flex items-center justify-between text-xs text-neutral-600 border border-black/5">
            <span>Total de horas do turno:</span>
            <b className="text-neutral-900 text-sm tabular-nums">
              {fmtHours(calculatedHours > 0 ? calculatedHours : daySchedule.hours)}h
            </b>
          </div>

          {/* Atendimentos no dia list */}
          <div className="space-y-2 pt-2 border-t border-black/5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-900">Atendimentos no dia</h4>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewCallForDay(daySchedule.day, collaboratorId);
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#319685] hover:underline cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Registrar atendimento</span>
              </button>
            </div>

            {dayCalls.length === 0 ? (
              <div className="py-3.5 text-center text-xs text-neutral-400 bg-neutral-50 rounded-2xl border border-black/5">
                Nenhum atendimento registrado neste dia.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {dayCalls.map((call) => {
                  const dType = demandTypes.find((d) => d.id === call.demandTypeId);
                  const dur = computeDurationText(call.inicio, call.fim);
                  const collab = collaborators.find((c) => c.id === call.collaboratorId);

                  return (
                    <div
                      key={call.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-50 border border-black/5 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {dType && (
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: `${dType.color}18`, color: dType.color }}
                          >
                            {dType.label}
                          </span>
                        )}
                        <span className="font-semibold text-neutral-800 truncate">
                          {collab?.name || '-'}
                        </span>
                        <span className="text-neutral-400 text-[11px] shrink-0">· {dur}</span>
                      </div>

                      {(isAdmin || call.collaboratorId === session?.collaboratorId) && (
                        <button
                          type="button"
                          onClick={() => onDeleteCall(call.id)}
                          className="p-1 text-neutral-400 hover:text-[#E84A4E] transition-colors cursor-pointer"
                          title="Excluir demanda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end flex-wrap gap-2.5 pt-4 border-t border-black/5">
          {isAdmin && daySchedule.isCustom && (
            <button
              type="button"
              onClick={handleClear}
              className="mr-auto px-4 py-2 rounded-2xl border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Remover plantão
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl border border-black/10 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            {isAdmin ? 'Cancelar' : 'Fechar'}
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 transition-all cursor-pointer"
            >
              Salvar alterações
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

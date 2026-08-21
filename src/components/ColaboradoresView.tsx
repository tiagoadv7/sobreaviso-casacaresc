import React from 'react';
import { Collaborator, DaySchedule } from '../types';
import { collaboratorStatusLabel, fmtHours, getInitials } from '../utils/calc';
import { Phone, Pencil, Trash2, UserPlus, AlertCircle } from 'lucide-react';

interface ColaboradoresViewProps {
  collaborators: Collaborator[];
  schedule: DaySchedule[];
  onOpenModal: (collabId?: string) => void;
  onDeleteCollaborator: (collabId: string) => void;
}

export const ColaboradoresView: React.FC<ColaboradoresViewProps> = ({
  collaborators,
  schedule,
  onOpenModal,
  onDeleteCollaborator,
}) => {
  // Compute monthly totals and shift counts
  const totalsByCollab: Record<string, number> = {};
  const shiftsByCollab: Record<string, number> = {};

  collaborators.forEach((c) => {
    totalsByCollab[c.id] = 0;
    shiftsByCollab[c.id] = 0;
  });

  schedule.forEach((d) => {
    if (d.collaboratorId && totalsByCollab[d.collaboratorId] !== undefined) {
      totalsByCollab[d.collaboratorId] += d.hours;
      shiftsByCollab[d.collaboratorId] += 1;
    }
  });

  const maxHours = Math.max(...Object.values(totalsByCollab), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner / Add card */}
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex items-center justify-between gap-4 flex-wrap hover:border-black/20 transition-all">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Equipe de Sobreaviso
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gerencie os colaboradores, contatos de emergência e visualize o total de horas e turnos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-semibold bg-[#319685] text-white hover:bg-[#084F42] shadow-md shadow-[#319685]/30 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Cadastrar Colaborador</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collaborators.map((c) => {
          const hours = totalsByCollab[c.id] || 0;
          const shifts = shiftsByCollab[c.id] || 0;
          const pct = Math.round((hours / maxHours) * 100);
          const canDelete = shifts === 0;

          return (
            <div
              key={c.id}
              className="bg-[#fcfcfb] border border-black/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:border-black/20 hover:-translate-y-0.5"
            >
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                    style={{ backgroundColor: c.color }}
                  >
                    {getInitials(c.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className="font-bold text-neutral-900 text-sm truncate">{c.name}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${
                          c.status === 'ativo'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {collaboratorStatusLabel(c)}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-500 truncate mt-0.5">
                      {c.role || 'Colaborador'}
                      {c.matricula ? ` · Mat. ${c.matricula}` : ''}
                    </div>
                  </div>
                </div>

                {/* Contact */}
                {c.contact && (
                  <div className="flex items-center gap-2 text-xs text-neutral-600 bg-neutral-50/80 px-3.5 py-2 rounded-2xl border border-black/5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="font-medium">{c.contact}</span>
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Horas acumuladas</span>
                    <b className="text-neutral-900 tabular-nums">{fmtHours(hours)}h</b>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#f4f4f1] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: c.color }}
                    />
                  </div>
                </div>

                {/* Shifts note */}
                <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                  <span>{shifts} turnos atribuídos</span>
                  {c.note && <span className="italic truncate max-w-[140px]">{c.note}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 pt-4 mt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => onOpenModal(c.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-2xl border border-black/10 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <Pencil className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteCollaborator(c.id)}
                  disabled={!canDelete}
                  title={
                    canDelete
                      ? 'Excluir colaborador'
                      : 'Possui turnos atribuídos neste mês — altere o status para Licença'
                  }
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-2xl border text-xs font-semibold transition-colors shadow-2xs ${
                    canDelete
                      ? 'border-red-200 text-red-600 hover:bg-red-50 cursor-pointer'
                      : 'border-black/5 text-neutral-300 bg-neutral-50 cursor-not-allowed'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

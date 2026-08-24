import React, { useEffect, useState } from 'react';
import { Collaborator, DaySchedule } from '../../types';
import { collaboratorStatusLabel, defaultShiftHoursForKind, computeDurationHours, pad } from '../../utils/calc';
import { MONTH_NAMES } from '../../utils/constants';
import { X, CalendarRange, User, Wand2 } from 'lucide-react';
import { CustomSelect, SelectOption } from '../CustomSelect';

interface WeekScheduleModalProps {
  isOpen: boolean;
  schedule: DaySchedule[];
  collaborators: Collaborator[];
  currentYear: number;
  currentMonth: number;
  onClose: () => void;
  onSaveWeek: (entries: { date: string; data: Partial<DaySchedule> }[]) => Promise<void>;
}

export const WeekScheduleModal: React.FC<WeekScheduleModalProps> = ({
  isOpen,
  schedule,
  collaborators,
  currentYear,
  currentMonth,
  onClose,
  onSaveWeek,
}) => {
  const weekIndexes = Array.from(new Set(schedule.map((d) => d.weekIndex))).sort((a, b) => a - b);

  const [selectedWeek, setSelectedWeek] = useState<number>(weekIndexes[0] ?? 1);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [quickCollaboratorId, setQuickCollaboratorId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const weekDays = schedule.filter((d) => d.weekIndex === selectedWeek);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedWeek(weekIndexes[0] ?? 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, string> = {};
    schedule
      .filter((d) => d.weekIndex === selectedWeek)
      .forEach((d) => {
        initial[d.date] = d.collaboratorId;
      });
    setAssignments(initial);
    setQuickCollaboratorId('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedWeek]);

  if (!isOpen) return null;

  const collaboratorOptions: SelectOption[] = [
    { value: '', label: '— Nenhum —' },
    ...collaborators.map((c): SelectOption => ({
      value: c.id,
      label: c.name,
      color: c.color,
      badge: c.status !== 'ativo' ? collaboratorStatusLabel(c) : undefined,
      icon: <User className="w-3.5 h-3.5 text-neutral-400" />,
    })),
  ];

  const weekOptions: SelectOption[] = weekIndexes.map((wi) => {
    const days = schedule.filter((d) => d.weekIndex === wi);
    const first = days[0]?.day;
    const last = days[days.length - 1]?.day;
    return { value: String(wi), label: `Semana ${wi} (${first}-${last})` };
  });

  const handleApplyToAll = () => {
    if (!quickCollaboratorId) return;
    const next: Record<string, string> = {};
    weekDays.forEach((d) => {
      next[d.date] = quickCollaboratorId;
    });
    setAssignments(next);
  };

  const handleSave = async () => {
    const entries = weekDays
      .filter((d) => assignments[d.date])
      .map((d) => {
        const defaults = defaultShiftHoursForKind(d.kind);
        const start = d.isCustom && d.start ? d.start : defaults.start;
        const end = d.isCustom && d.end ? d.end : defaults.end;
        return {
          date: d.date,
          data: {
            collaboratorId: assignments[d.date],
            start,
            end,
            hours: computeDurationHours(start, end),
            isCustom: true,
          },
        };
      });

    if (entries.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await onSaveWeek(entries);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl w-full max-w-lg p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#319685]/15 flex items-center justify-center shrink-0">
              <CalendarRange className="w-5 h-5 text-[#084F42]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Adicionar escala da semana</h3>
              <p className="text-xs text-neutral-400 font-medium">
                {MONTH_NAMES[currentMonth]}/{currentYear} · defina o colaborador de cada dia de uma vez
              </p>
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

        {/* Semana */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-700">Semana</label>
          <CustomSelect
            options={weekOptions}
            value={String(selectedWeek)}
            onChange={(val) => setSelectedWeek(parseInt(val, 10))}
          />
        </div>

        {/* Preenchimento rápido */}
        <div className="flex items-end gap-2.5 p-3.5 rounded-2xl bg-neutral-50 border border-black/5">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              Preencher a semana toda com
            </label>
            <CustomSelect
              options={collaboratorOptions}
              value={quickCollaboratorId}
              onChange={setQuickCollaboratorId}
              placeholder="Selecione um colaborador"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyToAll}
            disabled={!quickCollaboratorId}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#319685]/10 text-[#084F42] text-xs font-semibold hover:bg-[#319685]/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Aplicar
          </button>
        </div>

        {/* Dias da semana selecionada */}
        <div className="space-y-2">
          {weekDays.map((d) => {
            const defaults = defaultShiftHoursForKind(d.kind);
            const horarioLabel =
              d.isCustom && d.start && d.end ? `${d.start} às ${d.end}` : `${defaults.start} às ${defaults.end}`;
            return (
              <div
                key={d.date}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-black/5 shadow-2xs"
              >
                <div className="w-16 shrink-0">
                  <p className="text-xs font-bold text-neutral-800">{pad(d.day)}</p>
                  <p className="text-[10px] text-neutral-400 truncate">{d.weekdayLabel}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <CustomSelect
                    options={collaboratorOptions}
                    value={assignments[d.date] ?? ''}
                    onChange={(val) => setAssignments((prev) => ({ ...prev, [d.date]: val }))}
                    placeholder="— Nenhum —"
                  />
                </div>
                <span className="text-[10px] font-semibold text-neutral-400 shrink-0 w-24 text-right">
                  {horarioLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-4 border-t border-black/5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-black/10 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Salvar escala da semana'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

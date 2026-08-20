import React, { useState, useEffect } from 'react';
import { Collaborator, DemandType, CallRecord, CallStatus, DaySchedule } from '../../types';
import { PALETTE, EXTRA_COLORS, WEEKDAY_LABELS } from '../../utils/constants';
import { pad } from '../../utils/calc';
import { X, ChevronDown, Tag, Clock, Calendar, User, CheckCircle2, AlertCircle } from 'lucide-react';
import { CustomSelect, SelectOption } from '../CustomSelect';

interface DemandModalProps {
  isOpen: boolean;
  editingCall: CallRecord | null;
  presetDay?: number;
  presetCollabId?: string;
  collaborators: Collaborator[];
  demandTypes: DemandType[];
  schedule: DaySchedule[];
  isAdmin: boolean;
  ownCollaboratorId?: string;
  currentYear: number;
  currentMonth: number;
  onClose: () => void;
  onSaveCall: (callData: Omit<CallRecord, 'id'>, existingId?: string) => void;
  onAddNewDemandType: (label: string, color: string) => Promise<string>;
}

export const DemandModal: React.FC<DemandModalProps> = ({
  isOpen,
  editingCall,
  presetDay,
  presetCollabId,
  collaborators,
  demandTypes,
  schedule,
  isAdmin,
  ownCollaboratorId,
  currentYear,
  currentMonth,
  onClose,
  onSaveCall,
  onAddNewDemandType,
}) => {
  const [day, setDay] = useState<number>(1);
  const [collaboratorId, setCollaboratorId] = useState<string>('');
  const [demandTypeId, setDemandTypeId] = useState<string>('');
  const [contato, setContato] = useState<string>('');
  const [beneficiario, setBeneficiario] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');
  const [inicio, setInicio] = useState<string>('');
  const [fim, setFim] = useState<string>('');
  const [status, setStatus] = useState<CallStatus>('pendente');

  // Custom demand creator
  const [isDemandPickerOpen, setIsDemandPickerOpen] = useState<boolean>(false);
  const [newDemandLabel, setNewDemandLabel] = useState<string>('');
  const [newDemandColor, setNewDemandColor] = useState<string>(PALETTE[0]);
  const [errorText, setErrorText] = useState<string>('');

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Dia atual do calendário como padrão ao abrir para um novo registro
  // (só faz sentido quando o mês/ano em exibição é o mês/ano corrente).
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const todayAsDefaultDay = isCurrentMonth ? today.getDate() : 1;

  // Colaborador (não admin) só registra demanda em dias/como o colaborador
  // que o administrador escalou no calendário. Não se aplica a admin, nem a
  // edição de um chamado já existente.
  const isRestricted = !isAdmin && !editingCall;
  const daysScheduledForOwnCollaborator = new Set(
    schedule.filter((d) => d.collaboratorId === ownCollaboratorId).map((d) => d.day)
  );
  const noScheduledDays = isRestricted && daysScheduledForOwnCollaborator.size === 0;
  const missingCollaboratorLink = isRestricted && !ownCollaboratorId;

  useEffect(() => {
    if (editingCall) {
      setDay(editingCall.day);
      setCollaboratorId(editingCall.collaboratorId);
      setDemandTypeId(editingCall.demandTypeId);
      setContato(editingCall.contato || '');
      setBeneficiario(editingCall.beneficiario || '');
      setMotivo(editingCall.motivo || '');
      setInicio(editingCall.inicio || '');
      setFim(editingCall.fim || '');
      setStatus(editingCall.status);
    } else if (isRestricted) {
      const scheduledDays = Array.from(daysScheduledForOwnCollaborator).sort((a, b) => a - b);
      const initialDay =
        presetDay && daysScheduledForOwnCollaborator.has(presetDay)
          ? presetDay
          : scheduledDays.includes(todayAsDefaultDay)
          ? todayAsDefaultDay
          : scheduledDays[0] ?? todayAsDefaultDay;
      setDay(initialDay);
      setCollaboratorId(ownCollaboratorId || '');
      setDemandTypeId(demandTypes[0]?.id || '');
      setContato('');
      setBeneficiario('');
      setMotivo('');
      setInicio('19:00');
      setFim('19:30');
      setStatus('pendente');
    } else {
      setDay(presetDay || todayAsDefaultDay);
      setCollaboratorId(presetCollabId || (collaborators[0]?.id || ''));
      setDemandTypeId(demandTypes[0]?.id || '');
      setContato('');
      setBeneficiario('');
      setMotivo('');
      setInicio('19:00');
      setFim('19:30');
      setStatus('pendente');
    }
    setErrorText('');
    setIsDemandPickerOpen(false);
  }, [editingCall, presetDay, presetCollabId, isOpen]);

  if (!isOpen) return null;

  const currentDemand = demandTypes.find((d) => d.id === demandTypeId);

  const dayOptions: SelectOption[] = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    .filter((d) => !isRestricted || daysScheduledForOwnCollaborator.has(d))
    .map((d) => {
      const dateObj = new Date(currentYear, currentMonth, d);
      const wd = WEEKDAY_LABELS[dateObj.getDay()];
      return {
        value: d.toString(),
        label: `${pad(d)}/${pad(currentMonth + 1)} · ${wd}`,
        icon: <Calendar className="w-3.5 h-3.5 text-neutral-400" />,
      };
    });

  const collaboratorOptions: SelectOption[] = (
    isRestricted ? collaborators.filter((c) => c.id === ownCollaboratorId) : collaborators
  ).map((c) => ({
    value: c.id,
    label: c.name,
    color: c.color,
    badge: c.status === 'licenca' ? 'Em licença' : undefined,
    icon: <User className="w-3.5 h-3.5 text-neutral-400" />,
  }));

  const statusOptions: SelectOption[] = [
    {
      value: 'pendente',
      label: 'Pendente',
      color: '#d97706',
      icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500" />,
    },
    {
      value: 'concluido',
      label: 'Concluído',
      color: '#059669',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    },
  ];

  const handleCreateDemandType = async () => {
    if (!newDemandLabel.trim()) return;
    const newId = await onAddNewDemandType(newDemandLabel.trim(), newDemandColor);
    setDemandTypeId(newId);
    setNewDemandLabel('');
    setIsDemandPickerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!day || !collaboratorId || !demandTypeId) {
      setErrorText('Por favor, selecione o dia, colaborador e tipo de demanda.');
      return;
    }
    if (isRestricted && !daysScheduledForOwnCollaborator.has(day)) {
      setErrorText('Você só pode registrar demandas em dias com plantão liberado pelo administrador.');
      return;
    }

    onSaveCall(
      {
        day,
        collaboratorId,
        demandTypeId,
        contato: contato.trim(),
        beneficiario: beneficiario.trim(),
        motivo: motivo.trim(),
        inicio,
        fim,
        status,
      },
      editingCall?.id
    );
    onClose();
  };

  const allColors = [...PALETTE, ...EXTRA_COLORS];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl w-full max-w-lg p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              {editingCall ? 'Editar demanda' : 'Novo registro de demanda'}
            </h3>
            <p className="text-xs text-neutral-400 font-medium mt-0.5">
              Registre o dia, colaborador e tipo de demanda atendida durante o sobreaviso.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorText && (
          <div className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-200">
            {errorText}
          </div>
        )}

        {missingCollaboratorLink && (
          <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-2xl border border-amber-200">
            Sua conta não está vinculada a nenhum colaborador. Fale com o administrador para registrar demandas.
          </div>
        )}

        {!missingCollaboratorLink && noScheduledDays && (
          <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-2xl border border-amber-200">
            Você não tem nenhum plantão liberado neste mês. Só é possível registrar uma demanda em um dia com plantão atribuído pelo administrador.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dia & Colaborador com Rounded Custom Selects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Dia do mês *
              </label>
              <CustomSelect
                options={dayOptions}
                value={day.toString()}
                onChange={(val) => setDay(parseInt(val, 10))}
                placeholder="Selecione o dia"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Colaborador *
              </label>
              <CustomSelect
                options={collaboratorOptions}
                value={collaboratorId}
                onChange={(val) => setCollaboratorId(val)}
                disabled={isRestricted}
                placeholder="Selecione a colaboradora"
              />
            </div>
          </div>

          {/* Demanda Custom Dropdown com Rounded Popover */}
          <div className="space-y-1.5 relative">
            <label className="block text-xs font-semibold text-neutral-700">
              Tipo de demanda *
            </label>

            <button
              type="button"
              onClick={() => setIsDemandPickerOpen(!isDemandPickerOpen)}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 flex items-center justify-between hover:border-black/20 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 cursor-pointer shadow-2xs"
            >
              {currentDemand ? (
                <span
                  className="px-3 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: `${currentDemand.color}18`, color: currentDemand.color }}
                >
                  {currentDemand.label}
                </span>
              ) : (
                <span className="text-neutral-400">Selecionar demanda</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {/* Dropdown Panel com Rounded 2xl */}
            {isDemandPickerOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#ffffff] border border-black/10 rounded-2xl p-3.5 shadow-xl shadow-black/10 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
                  {demandTypes.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDemandTypeId(d.id);
                        setIsDemandPickerOpen(false);
                      }}
                      className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                        d.id === demandTypeId
                          ? 'bg-[#319685]/15 text-[#084F42] font-semibold'
                          : 'hover:bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-xs font-semibold truncate">
                        {d.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Add new demand type section */}
                <div className="pt-2.5 border-t border-black/5 space-y-2">
                  <div className="text-[11px] font-bold text-neutral-500 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#319685]" />
                    <span>Criar nova tag de demanda</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome da demanda..."
                      value={newDemandLabel}
                      onChange={(e) => setNewDemandLabel(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-black/10 bg-neutral-50 text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30"
                    />
                    <button
                      type="button"
                      onClick={handleCreateDemandType}
                      className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 cursor-pointer shadow-xs"
                    >
                      + Criar
                    </button>
                  </div>

                  {/* Swatches */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {allColors.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setNewDemandColor(hex)}
                        className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                          hex === newDemandColor ? 'ring-2 ring-neutral-900 scale-110 shadow-xs' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contato & Beneficiário */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Contato / Solicitante
              </label>
              <input
                type="text"
                placeholder="Ex: Márcia Souza"
                value={contato}
                onChange={(e) => setContato(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Beneficiário / Paciente
              </label>
              <input
                type="text"
                placeholder="Ex: João Pedro Alves"
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
              />
            </div>
          </div>

          {/* Motivo de transferência */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              Motivo de transferência (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Encaminhamento hospitalar"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
            />
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Hora inicial
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700">
                Hora final
              </label>
              <div className="relative">
                <input
                  type="time"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Status com Custom Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700">
              Conclusão / Status
            </label>
            <CustomSelect
              options={statusOptions}
              value={status}
              onChange={(val) => setStatus(val as CallStatus)}
              placeholder="Selecione o status"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-black/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl border border-black/10 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={noScheduledDays || missingCollaboratorLink}
              className="px-5 py-2 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Salvar demanda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

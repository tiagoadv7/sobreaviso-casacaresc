import React, { useState, useEffect } from 'react';
import { Collaborator, CollaboratorStatus } from '../../types';
import { PALETTE } from '../../utils/constants';
import { X, CheckCircle2, UserX, TreePalm, Pencil, Mail } from 'lucide-react';
import { CustomSelect, SelectOption } from '../CustomSelect';

interface CollaboratorModalProps {
  isOpen: boolean;
  editingCollab: Collaborator | null;
  linkedEmail?: string;
  onClose: () => void;
  onSaveCollaborator: (
    collabData: Omit<Collaborator, 'id'>,
    existingId?: string
  ) => void;
}

export const CollaboratorModal: React.FC<CollaboratorModalProps> = ({
  isOpen,
  editingCollab,
  linkedEmail,
  onClose,
  onSaveCollaborator,
}) => {
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [matricula, setMatricula] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [status, setStatus] = useState<CollaboratorStatus>('ativo');
  const [customStatusLabel, setCustomStatusLabel] = useState<string>('');
  const [color, setColor] = useState<string>(PALETTE[0]);
  const [note, setNote] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');

  useEffect(() => {
    if (editingCollab) {
      setName(editingCollab.name);
      setRole(editingCollab.role || '');
      setMatricula(editingCollab.matricula || '');
      setContact(editingCollab.contact || '');
      setStatus(editingCollab.status);
      setCustomStatusLabel(editingCollab.customStatusLabel || '');
      setColor(editingCollab.color);
      setNote(editingCollab.note || '');
    } else {
      setName('');
      setRole('Analista de suporte');
      setMatricula('');
      setContact('');
      setStatus('ativo');
      setCustomStatusLabel('');
      setColor(PALETTE[0]);
      setNote('');
    }
    setErrorText('');
  }, [editingCollab, isOpen]);

  if (!isOpen) return null;

  const statusOptions: SelectOption[] = [
    {
      value: 'ativo',
      label: 'Ativo (participa da escala)',
      color: '#059669',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    },
    {
      value: 'licenca',
      label: 'Em licença (não entra na escala)',
      color: '#dc2626',
      icon: <UserX className="w-3.5 h-3.5 text-red-500" />,
    },
    {
      value: 'ferias',
      label: 'Férias (não entra na escala)',
      color: '#0284c7',
      icon: <TreePalm className="w-3.5 h-3.5 text-sky-500" />,
    },
    {
      value: 'personalizado',
      label: 'Personalizado (não entra na escala)',
      color: '#7c3aed',
      icon: <Pencil className="w-3.5 h-3.5 text-violet-500" />,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorText('Por favor, informe o nome do colaborador.');
      return;
    }
    if (status === 'personalizado' && !customStatusLabel.trim()) {
      setErrorText('Informe o nome do status personalizado.');
      return;
    }

    onSaveCollaborator(
      {
        name: name.trim(),
        role: role.trim(),
        matricula: matricula.trim(),
        contact: contact.trim(),
        status,
        customStatusLabel: status === 'personalizado' ? customStatusLabel.trim() : '',
        color,
        note: note.trim(),
      },
      editingCollab?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#fcfcfb] border border-black/10 rounded-3xl w-full max-w-md p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative text-center">
          <h3 className="text-base font-bold text-neutral-900">
            {editingCollab ? 'Editar colaborador' : 'Adicionar colaborador'}
          </h3>
          <p className="text-xs text-neutral-400 font-medium mt-0.5">
            Preencha os dados da colaboradora ou colaborador de sobreaviso.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-0 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorText && (
          <div className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-200">
            {errorText}
          </div>
        )}

        {editingCollab && linkedEmail && (
          <div className="flex items-center gap-2 text-xs text-[#084F42] bg-[#DEEDE0]/50 p-3 rounded-2xl border border-[#319685]/20">
            <Mail className="w-3.5 h-3.5 text-[#319685] shrink-0" />
            <span className="font-medium truncate">Conta de acesso vinculada: {linkedEmail}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 text-center">
              Nome *
            </label>
            <input
              type="text"
              placeholder="Ex: Fernanda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 text-center focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
            />
          </div>

          {/* Função */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 text-center">
              Função
            </label>
            <input
              type="text"
              placeholder="Ex: Analista de suporte"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 text-center focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
            />
          </div>

          {/* Matrícula & Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 text-center">
                Matrícula
              </label>
              <input
                type="text"
                placeholder="Ex: 0007"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 text-center focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 text-center">
                Contato
              </label>
              <input
                type="text"
                placeholder="(11) 90000-0000"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 text-center focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
              />
            </div>
          </div>

          {/* Status com Rounded Custom Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 text-center">
              Status
            </label>
            <CustomSelect
              options={statusOptions}
              value={status}
              onChange={(val) => setStatus(val as CollaboratorStatus)}
              placeholder="Selecione o status"
            />
          </div>

          {/* Nome do status personalizado — só aparece quando selecionado acima */}
          {status === 'personalizado' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-700 text-center">
                Nome do status *
              </label>
              <input
                type="text"
                placeholder="Ex: Atestado médico"
                value={customStatusLabel}
                onChange={(e) => setCustomStatusLabel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 text-center focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
              />
            </div>
          )}

          {/* Cor (Swatches) */}
          <div className="space-y-1.5 text-center">
            <label className="block text-xs font-semibold text-neutral-700 text-center">
              Cor do colaborador
            </label>
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColor(hex)}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer ${
                    hex === color
                      ? 'ring-2 ring-neutral-900 ring-offset-2 scale-110 shadow-xs'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-700 text-center">
              Observação (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Apoio nos domingos"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-2xl border border-black/10 bg-[#fcfcfb] text-xs font-medium text-neutral-900 text-center focus:outline-none focus:ring-2 focus:ring-[#319685]/30 shadow-2xs"
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
              className="px-5 py-2 rounded-2xl bg-[#319685] text-white text-xs font-semibold hover:bg-[#084F42] shadow-md shadow-[#319685]/25 transition-all cursor-pointer"
            >
              Salvar colaborador
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

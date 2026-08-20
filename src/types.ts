export type ShiftKind = 'semana' | 'fim_de_semana' | 'apoio';
export type CallStatus = 'pendente' | 'concluido';
export type CollaboratorStatus = 'ativo' | 'licenca';

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  matricula: string;
  contact: string;
  color: string;
  status: CollaboratorStatus;
  note: string;
}

export interface DemandType {
  id: string;
  label: string;
  color: string;
}

export interface CallRecord {
  id: string;
  day: number;
  collaboratorId: string;
  demandTypeId: string;
  contato: string;
  beneficiario: string;
  motivo: string;
  observacao: string;
  inicio: string; // "19:10"
  fim: string;    // "19:40"
  status: CallStatus;
}

export interface DaySchedule {
  day: number;
  date: string; // "2026-08-01"
  weekIndex: number;
  weekdayLabel: string;
  jsWeekday: number; // 0=Dom, 1=Seg, ... 6=Sab
  collaboratorId: string;
  start: string; // "18:00" or "07:30"
  end: string;   // "07:30"
  hours: number;
  kind: ShiftKind;
  demand: string;
  isCustom?: boolean;
}

export interface HECalculationRow {
  he75a: number;   // HE 75% dia útil diurno
  he100b: number;  // HE 100% domingo diurno
  he75c: number;   // HE 75% c/ Adic. Noturno (dia útil 22h-5h)
  he100d: number;  // HE 100% c/ Adic. Noturno (domingo 22h-5h)
  atendimentos: number;
}

export type TabView = 'dashboard' | 'escala' | 'chamados' | 'calculo-horas' | 'colaboradores' | 'admin';

export type UserRole = 'admin' | 'colaborador';

export interface SystemUser {
  uid: string;                // Firebase Auth UID
  email: string;
  displayName: string;
  role: UserRole;
  collaboratorId?: string;   // vinculado ao Collaborator.id
  disabled?: boolean;
  createdAt?: string;
  mustChangePassword?: boolean; // true até o primeiro acesso definir uma senha própria
}

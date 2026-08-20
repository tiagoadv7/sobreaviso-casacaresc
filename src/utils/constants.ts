import { Collaborator, DemandType, CallRecord } from '../types';

export const PALETTE = [
  '#319685', // Verde Médio (Pantone 7473 C)
  '#6BC0B2', // Verde Claro (Pantone 563 C)
  '#E84A4E', // Vermelho (Pantone 7625 C)
  '#084F42', // Verde Escuro (Pantone 343 C)
  '#EE7870', // Coral (Pantone 805 C)
  '#9AD0BE', // Verde Menta (Pantone 7464 C)
  '#DEEDE0', // Verde Menta Claro (Pantone 656)
  '#1e1e1c', // Cinza Escuro
];

export const EXTRA_COLORS = ['#319685', '#6BC0B2', '#E84A4E', '#084F42', '#EE7870', '#9AD0BE', '#DEEDE0', '#1e1e1c'];

export const MUTED_COLOR = '#9AD0BE';

export const INITIAL_COLLABORATORS: Collaborator[] = [];

export const INITIAL_DEMAND_TYPES: DemandType[] = [
  { id: 'autorizacao', label: 'Autorização', color: '#319685' },
  { id: 'elegibilidade', label: 'Elegibilidade', color: '#6BC0B2' },
  { id: 'remocao', label: 'Remoção', color: '#E84A4E' },
  { id: 'busca-de-rede', label: 'Busca de rede', color: '#084F42' },
  { id: 'financeiro', label: 'Financeiro', color: '#EE7870' },
  { id: 'cadastro', label: 'Cadastro', color: '#9AD0BE' },
  { id: 'home-care', label: 'Home Care', color: '#1e1e1c' },
  { id: 'reembolso', label: 'Reembolso', color: '#319685' },
];

export const INITIAL_CALLS: CallRecord[] = [];

export const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const DEFAULT_YEAR = 2026;
export const DEFAULT_MONTH = 7; // Agosto (0-indexed)

import React, { useState, useEffect } from 'react';
import { Check, Trash2, AlertCircle } from 'lucide-react';
import {
  Collaborator,
  DemandType,
  CallRecord,
  DaySchedule,
  TabView,
} from './types';
import {
  DEFAULT_YEAR,
  DEFAULT_MONTH,
  MONTH_NAMES,
} from './utils/constants';
import {
  buildSchedule,
  exportCsvFile,
  fmtHours,
  calcHEByCollaborator,
  pad,
} from './utils/calc';

// Firebase data layer
import {
  subscribeCollaborators,
  subscribeCalls,
  subscribeDemandTypes,
  subscribeScheduleOverrides,
  saveCollaborator,
  deleteCollaborator as dbDeleteCollaborator,
  saveCall,
  deleteCall as dbDeleteCall,
  saveDemandType,
  saveScheduleOverride,
  deleteScheduleOverride,
  saveWeekSchedule,
} from './firebase/db';

import { AuthProvider, useAuth } from './auth/AuthContext';

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoginScreen } from './components/LoginScreen';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { FirstAccessScreen } from './components/FirstAccessScreen';
import { DashboardView } from './components/DashboardView';
import { EscalaView } from './components/EscalaView';
import { DemandasView } from './components/DemandasView';
import { CalculoHorasView } from './components/CalculoHorasView';
import { ColaboradoresView } from './components/ColaboradoresView';
import { AdminView } from './components/AdminView';

import { DayModal } from './components/modals/DayModal';
import { WeekScheduleModal } from './components/modals/WeekScheduleModal';
import { DemandModal } from './components/modals/DemandModal';
import { CollaboratorModal } from './components/modals/CollaboratorModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { ConfirmModal } from './components/modals/ConfirmModal';

/* ─── Loading screen ─── */
// Anel de 4 cores girando ao redor do ícone circular do sistema, com o
// ícone entrando em "bounce" — mesmo espírito da splash screen do
// FinançasApp, com as cores e o ícone do Casacaresc.
const RING_RADIUS = 70;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_QUARTER = RING_CIRCUMFERENCE / 4;
const RING_COLORS = ['#319685', '#084F42', '#6BC0B2', '#E84A4E'];

function LoadingScreen({ displayName }: { displayName?: string } = {}) {
  return (
    <div
      className="min-h-dvh w-full flex flex-col items-center justify-center gap-6"
      style={{ background: 'linear-gradient(135deg, #084F42 0%, #1e1e1c 50%, #084F42 100%)' }}
    >
      <div className="relative w-[150px] h-[150px] flex items-center justify-center shrink-0">
        <svg viewBox="0 0 150 150" className="absolute inset-0 w-full h-full sobreaviso-loading-ring">
          {RING_COLORS.map((color, i) => (
            <circle
              key={color}
              cx="75"
              cy="75"
              r={RING_RADIUS}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeDasharray={`${RING_QUARTER} ${RING_CIRCUMFERENCE - RING_QUARTER}`}
              strokeDashoffset={-i * RING_QUARTER}
              transform="rotate(-90 75 75)"
            />
          ))}
        </svg>
        {/* Disco branco atrás do selo — a marca (mãos coral/verde-água)
            perde contraste sobre o fundo verde-escuro sem uma base clara.
            Usa o favicon (selo com o nome "CASACARESC" dentro), não só o
            ícone das mãos sem nenhum texto. */}
        <div className="w-[128px] h-[128px] rounded-full bg-white shadow-lg flex items-center justify-center sobreaviso-loading-icon">
          <img
            src="/favicon.svg"
            alt="Casacaresc"
            className="w-28 h-28 object-contain"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-white text-lg font-bold tracking-tight">Sobreaviso</p>
        {displayName && (
          <p className="text-white text-sm font-bold">Bem-vindo(a), {displayName}!</p>
        )}
        <p className="text-white/70 text-xs font-medium">Carregando…</p>
      </div>
    </div>
  );
}

/* ─── Inner app (requires auth) ─── */
function AppInner() {
  const { session, isAdmin, users } = useAuth();
  const role = session?.role ?? 'colaborador';

  const [currentTab, setCurrentTab] = useState<TabView>('dashboard');
  const [currentYear, setCurrentYear] = useState<number>(DEFAULT_YEAR);
  const [currentMonth, setCurrentMonth] = useState<number>(DEFAULT_MONTH);

  // Firestore real-time state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [demandTypes, setDemandTypes] = useState<DemandType[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, Partial<DaySchedule>>>({});
  const [dataLoading, setDataLoading] = useState(true);

  // Duração mínima da tela de boas-vindas: quando o Firestore já tem os
  // dados em cache (comum para o admin, que acabou de rodar o seed check),
  // os snapshots iniciais chegam quase instantaneamente e a mensagem de
  // boas-vindas nunca chega a ser percebida. Isso garante um tempo mínimo
  // de exibição independente da velocidade da resposta do Firestore.
  const [minLoadTimeElapsed, setMinLoadTimeElapsed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinLoadTimeElapsed(true), 700);
    return () => clearTimeout(t);
  }, []);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'delete' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'delete' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  // ─── Firestore subscriptions ───────────────────────────────────────────────

  useEffect(() => {
    let loaded = 0;
    const checkDone = () => { if (++loaded >= 4) setDataLoading(false); };

    const unsubs = [
      subscribeCollaborators((data) => { setCollaborators(data); checkDone(); }),
      subscribeCalls((data) => { setCalls(data); checkDone(); }),
      subscribeDemandTypes((data) => { setDemandTypes(data); checkDone(); }),
      subscribeScheduleOverrides((data) => { setScheduleOverrides(data); checkDone(); }),
    ];

    return () => unsubs.forEach((u) => u());
  }, []);

  // Modals state
  const [isDayModalOpen, setIsDayModalOpen] = useState<boolean>(false);
  const [selectedDaySchedule, setSelectedDaySchedule] = useState<DaySchedule | null>(null);

  const [isDemandModalOpen, setIsDemandModalOpen] = useState<boolean>(false);
  const [editingCall, setEditingCall] = useState<CallRecord | null>(null);
  const [presetDayForCall, setPresetDayForCall] = useState<number | undefined>(undefined);
  const [presetCollabForCall, setPresetCollabForCall] = useState<string | undefined>(undefined);

  const [isCollabModalOpen, setIsCollabModalOpen] = useState<boolean>(false);
  const [editingCollab, setEditingCollab] = useState<Collaborator | null>(null);

  // Profile modal (for collaborator editing own profile)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const ownCollaborator = session?.collaboratorId
    ? collaborators.find((c) => c.id === session.collaboratorId) ?? null
    : null;

  // Computed schedule
  const schedule = buildSchedule(currentYear, currentMonth, collaborators, scheduleOverrides);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };
  const handleGoToToday = () => {
    setCurrentYear(DEFAULT_YEAR);
    setCurrentMonth(DEFAULT_MONTH);
  };

  // ─── Day Modal ─────────────────────────────────────────────────────────────

  const handleOpenDayModal = (daySched: DaySchedule) => {
    setSelectedDaySchedule(daySched);
    setIsDayModalOpen(true);
  };

  const handleSaveDay = async (updated: Partial<DaySchedule>) => {
    if (!selectedDaySchedule) return;
    const date = selectedDaySchedule.date;
    const merged = { ...scheduleOverrides[date], ...updated };
    await saveScheduleOverride(date, merged);
    showToast('Dia atualizado com sucesso.');
  };

  const handleClearDay = async () => {
    if (!selectedDaySchedule) return;
    await deleteScheduleOverride(selectedDaySchedule.date);
    showToast('Plantão removido do dia.', 'delete');
  };

  const handleOpenNewCallForDay = (day: number, collaboratorId: string) => {
    setEditingCall(null);
    setPresetDayForCall(day);
    setPresetCollabForCall(collaboratorId);
    setIsDemandModalOpen(true);
  };

  // ─── Week Schedule Modal ────────────────────────────────────────────────────

  const [isWeekScheduleModalOpen, setIsWeekScheduleModalOpen] = useState<boolean>(false);

  const handleSaveWeekSchedule = async (
    entries: { date: string; data: Partial<DaySchedule> }[]
  ) => {
    await saveWeekSchedule(entries);
    showToast('Escala da semana salva com sucesso.');
  };

  // ─── Calls / Demands ───────────────────────────────────────────────────────

  const handleOpenCallModal = (callId?: string) => {
    if (callId) {
      setEditingCall(calls.find((c) => c.id === callId) || null);
      setPresetDayForCall(undefined);
      setPresetCollabForCall(undefined);
    } else {
      setEditingCall(null);
      setPresetDayForCall(undefined);
      setPresetCollabForCall(undefined);
    }
    setIsDemandModalOpen(true);
  };

  const handleSaveCall = async (callData: Omit<CallRecord, 'id'>, existingId?: string) => {
    await saveCall(callData, existingId);
    showToast(existingId ? 'Demanda atualizada.' : 'Demanda registrada com sucesso.');
  };

  const [callPendingDelete, setCallPendingDelete] = useState<CallRecord | null>(null);
  const [isDeletingCall, setIsDeletingCall] = useState(false);

  const handleDeleteCall = (callId: string) => {
    const target = calls.find((c) => c.id === callId);
    if (!target) return;
    setCallPendingDelete(target);
  };

  const confirmDeleteCall = async () => {
    if (!callPendingDelete) return;
    setIsDeletingCall(true);
    try {
      await dbDeleteCall(callPendingDelete.id);
      showToast('Demanda excluída.', 'delete');
      setCallPendingDelete(null);
    } catch {
      showToast('Erro ao excluir demanda.', 'error');
    } finally {
      setIsDeletingCall(false);
    }
  };

  const handleAddNewDemandType = async (label: string, color: string): Promise<string> => {
    const slug =
      label.toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `demanda-${Date.now()}`;
    await saveDemandType({ id: slug, label, color });
    showToast(`Tipo de demanda "${label}" criado.`);
    return slug;
  };

  // ─── Collaborators ─────────────────────────────────────────────────────────

  const handleOpenCollaboratorModal = (collabId?: string) => {
    if (!isAdmin) return;
    setEditingCollab(collabId ? collaborators.find((c) => c.id === collabId) || null : null);
    setIsCollabModalOpen(true);
  };

  const handleSaveCollaborator = async (
    collabData: Omit<Collaborator, 'id'>,
    existingId?: string
  ) => {
    await saveCollaborator(collabData, existingId);
    showToast(existingId ? 'Colaborador atualizado.' : 'Colaborador adicionado com sucesso.');
  };

  const [collabPendingDelete, setCollabPendingDelete] = useState<Collaborator | null>(null);
  const [isDeletingCollab, setIsDeletingCollab] = useState(false);

  const handleDeleteCollaborator = (collabId: string) => {
    if (!isAdmin) return;
    const target = collaborators.find((c) => c.id === collabId);
    if (!target) return;
    setCollabPendingDelete(target);
  };

  const confirmDeleteCollaborator = async () => {
    if (!collabPendingDelete) return;
    setIsDeletingCollab(true);
    try {
      await dbDeleteCollaborator(collabPendingDelete.id);
      showToast('Colaborador excluído.', 'delete');
      setCollabPendingDelete(null);
    } catch {
      showToast('Erro ao excluir colaborador.', 'error');
    } finally {
      setIsDeletingCollab(false);
    }
  };

  // ─── Profile (own collaborator) ────────────────────────────────────────────

  const handleSaveProfile = async (updated: Partial<Collaborator>, id: string) => {
    const existing = collaborators.find((c) => c.id === id);
    if (!existing) return;
    await saveCollaborator({ ...existing, ...updated }, id);
    showToast('Perfil atualizado com sucesso.');
  };

  // ─── Export CSV / Excel ─────────────────────────────────────────────────────

  const buildExportData = (): {
    sheetName: string;
    title: string;
    filenameBase: string;
    headers: string[];
    rows: (string | number)[][];
  } => {
    const period = `${MONTH_NAMES[currentMonth]}/${currentYear}`;

    if (currentTab === 'calculo-horas') {
      const totalsByCollab: Record<string, number> = {};
      collaborators.forEach((c) => { totalsByCollab[c.id] = 0; });
      schedule.forEach((d) => {
        if (d.collaboratorId && totalsByCollab[d.collaboratorId] !== undefined)
          totalsByCollab[d.collaboratorId] += d.hours;
      });
      const heMap = calcHEByCollaborator(calls, collaborators, currentYear, currentMonth);
      const headers = ['Funcionário', 'Matrícula', 'Qtde de horas', 'HE 75% (a)', 'HE 100% (b)', 'HE 75% c/A.N (c)', 'HE 100% c/A.N (d)', 'Atendimentos'];
      const rows: (string | number)[][] = collaborators.map((c) => {
        const r = heMap[c.id] || { he75a: 0, he100b: 0, he75c: 0, he100d: 0, atendimentos: 0 };
        return [c.name, c.matricula || '-', fmtHours(totalsByCollab[c.id] || 0),
          fmtHours(r.he75a), fmtHours(r.he100b), fmtHours(r.he75c), fmtHours(r.he100d), r.atendimentos];
      });
      return {
        sheetName: 'Cálculo de horas',
        title: `Cálculo de Horas · ${period}`,
        filenameBase: `Calculo_de_horas_${MONTH_NAMES[currentMonth]}_${currentYear}`,
        headers,
        rows,
      };
    }

    if (currentTab === 'chamados') {
      const headers = ['Dia', 'Data', 'Colaborador', 'Demanda', 'Contato', 'Beneficiário', 'Motivo', 'Observação', 'Início', 'Fim', 'Status'];
      const rows: (string | number)[][] = calls.map((c) => {
        const collab = collaborators.find((x) => x.id === c.collaboratorId);
        const demand = demandTypes.find((x) => x.id === c.demandTypeId);
        return [c.day, `${pad(c.day)}/${pad(currentMonth + 1)}/${currentYear}`,
          collab?.name || '-', demand?.label || '-', c.contato || '-',
          c.beneficiario || '-', c.motivo || '-', c.observacao || '-', c.inicio || '-', c.fim || '-',
          c.status === 'concluido' ? 'Concluído' : 'Pendente'];
      });
      return {
        sheetName: 'Demandas',
        title: `Demandas · ${period}`,
        filenameBase: `Demandas_${MONTH_NAMES[currentMonth]}_${currentYear}`,
        headers,
        rows,
      };
    }

    const headers = ['Dia', 'Data', 'Dia da semana', 'Semana', 'Colaborador', 'Início', 'Fim', 'Horas', 'Tipo'];
    const rows: (string | number)[][] = schedule.map((d) => {
      const collab = collaborators.find((x) => x.id === d.collaboratorId);
      return [d.day, `${pad(d.day)}/${pad(currentMonth + 1)}/${currentYear}`, d.weekdayLabel, `Semana ${d.weekIndex}`,
        collab?.name || '-', d.start, d.end, d.hours, d.kind];
    });
    return {
      sheetName: 'Escala',
      title: `Escala de Sobreaviso · ${period}`,
      filenameBase: `Escala_Sobreaviso_${MONTH_NAMES[currentMonth]}_${currentYear}`,
      headers,
      rows,
    };
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    const { sheetName, title, filenameBase, headers, rows } = buildExportData();
    if (format === 'csv') {
      exportCsvFile(`${filenameBase}.csv`, [headers, ...rows]);
      showToast('CSV exportado com sucesso.');
    } else {
      const { exportXlsxFile } = await import('./utils/exportExcel');
      await exportXlsxFile(`${filenameBase}.xlsx`, headers, rows, { sheetName, title });
      showToast('Excel exportado com sucesso.');
    }
  };

  const handlePrint = () => window.print();

  // ─── Tab guard ─────────────────────────────────────────────────────────────

  const allowedTabsForCollab: TabView[] = ['dashboard', 'escala', 'chamados'];
  const safeTab: TabView =
    role === 'colaborador' && !allowedTabsForCollab.includes(currentTab)
      ? 'dashboard'
      : currentTab;

  const handleSelectTab = (tab: TabView) => {
    const adminOnly: TabView[] = ['calculo-horas', 'colaboradores', 'admin'];
    if (role === 'colaborador' && adminOnly.includes(tab)) return;
    setCurrentTab(tab);
  };

  // ─── Loading ───────────────────────────────────────────────────────────────

  if (dataLoading || !minLoadTimeElapsed) return <LoadingScreen displayName={session?.displayName} />;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-dvh w-full bg-[#edf2f7] text-[#0b0b0b] font-sans antialiased selection:bg-[#319685]/20 overflow-hidden">
      <Sidebar
        currentTab={safeTab}
        onSelectTab={handleSelectTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 my-3 mr-3 bg-white rounded-[28px] border border-black/[0.08] shadow-sm overflow-hidden h-[calc(100dvh-24px)]">
        <TopBar
          currentTab={safeTab}
          currentYear={currentYear}
          currentMonth={currentMonth}
          role={role}
          onExport={handleExport}
          onPrint={handlePrint}
          onOpenNewCollaboratorModal={() => handleOpenCollaboratorModal()}
        />

        <main className="p-4 sm:p-7 flex-1 overflow-y-auto bg-white rounded-b-[28px]">
          {safeTab === 'dashboard' && (
            <DashboardView
              collaborators={collaborators}
              demandTypes={demandTypes}
              calls={calls}
              schedule={schedule}
              currentYear={currentYear}
              currentMonth={currentMonth}
              onNavigateToCalls={() => setCurrentTab('chamados')}
              onOpenNewCallModal={() => handleOpenCallModal()}
            />
          )}
          {safeTab === 'escala' && (
            <EscalaView
              collaborators={collaborators}
              schedule={schedule}
              calls={calls}
              currentYear={currentYear}
              currentMonth={currentMonth}
              isAdmin={isAdmin}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectMonth={setCurrentMonth}
              onSelectYear={setCurrentYear}
              onGoToToday={handleGoToToday}
              onOpenDayModal={handleOpenDayModal}
              onOpenWeekScheduleModal={() => setIsWeekScheduleModalOpen(true)}
            />
          )}
          {safeTab === 'chamados' && (
            <DemandasView
              collaborators={collaborators}
              demandTypes={demandTypes}
              calls={calls}
              currentYear={currentYear}
              currentMonth={currentMonth}
              onOpenCallModal={handleOpenCallModal}
              onDeleteCall={handleDeleteCall}
            />
          )}
          {safeTab === 'calculo-horas' && isAdmin && (
            <CalculoHorasView
              collaborators={collaborators}
              calls={calls}
              schedule={schedule}
              currentYear={currentYear}
              currentMonth={currentMonth}
            />
          )}
          {safeTab === 'colaboradores' && isAdmin && (
            <ColaboradoresView
              collaborators={collaborators}
              schedule={schedule}
              onOpenModal={handleOpenCollaboratorModal}
              onDeleteCollaborator={handleDeleteCollaborator}
            />
          )}
          {safeTab === 'admin' && isAdmin && (
            <AdminView
              collaborators={collaborators}
              onOpenCollaboratorModal={handleOpenCollaboratorModal}
              onDeleteCollaborator={handleDeleteCollaborator}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <DayModal
        isOpen={isDayModalOpen}
        daySchedule={selectedDaySchedule}
        collaborators={collaborators}
        demandTypes={demandTypes}
        calls={calls}
        currentMonth={currentMonth}
        onClose={() => setIsDayModalOpen(false)}
        onSaveDay={handleSaveDay}
        onClearDay={handleClearDay}
        onOpenNewCallForDay={handleOpenNewCallForDay}
        onDeleteCall={handleDeleteCall}
      />
      <WeekScheduleModal
        isOpen={isWeekScheduleModalOpen}
        schedule={schedule}
        collaborators={collaborators}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onClose={() => setIsWeekScheduleModalOpen(false)}
        onSaveWeek={handleSaveWeekSchedule}
      />
      <DemandModal
        isOpen={isDemandModalOpen}
        editingCall={editingCall}
        presetDay={presetDayForCall}
        presetCollabId={presetCollabForCall}
        collaborators={collaborators}
        demandTypes={demandTypes}
        schedule={schedule}
        isAdmin={isAdmin}
        ownCollaboratorId={session?.collaboratorId}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onClose={() => setIsDemandModalOpen(false)}
        onSaveCall={handleSaveCall}
        onAddNewDemandType={handleAddNewDemandType}
      />
      <CollaboratorModal
        isOpen={isCollabModalOpen}
        editingCollab={editingCollab}
        linkedEmail={
          editingCollab
            ? users.find((u) => u.collaboratorId === editingCollab.id)?.email
            : undefined
        }
        onClose={() => setIsCollabModalOpen(false)}
        onSaveCollaborator={handleSaveCollaborator}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        collaborator={ownCollaborator}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleSaveProfile}
      />
      <ConfirmModal
        isOpen={!!collabPendingDelete}
        title="Excluir colaborador"
        message={
          collabPendingDelete
            ? `Deseja realmente excluir ${collabPendingDelete.name}? Essa ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        loading={isDeletingCollab}
        onConfirm={confirmDeleteCollaborator}
        onClose={() => setCollabPendingDelete(null)}
      />
      <ConfirmModal
        isOpen={!!callPendingDelete}
        title="Excluir demanda"
        message={
          callPendingDelete
            ? `Deseja excluir o registro de "${demandTypes.find((d) => d.id === callPendingDelete.demandTypeId)?.label || 'demanda'}" do dia ${pad(callPendingDelete.day)}? Essa ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        loading={isDeletingCall}
        onConfirm={confirmDeleteCall}
        onClose={() => setCallPendingDelete(null)}
      />

      {toastMessage && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-2.5 pl-2.5 pr-4 py-2 rounded-2xl text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastType === 'success'
              ? 'bg-[#319685] shadow-[#319685]/30'
              : 'bg-[#E84A4E] shadow-[#E84A4E]/30'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-white ${
              toastType === 'success' ? 'text-[#319685]' : 'text-[#E84A4E]'
            }`}
          >
            {toastType === 'success' ? (
              <Check className="w-3 h-3" strokeWidth={3} />
            ) : toastType === 'delete' ? (
              <Trash2 className="w-3 h-3" strokeWidth={2.5} />
            ) : (
              <AlertCircle className="w-3 h-3" strokeWidth={2.5} />
            )}
          </div>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

/* ─── Root ─── */
export default function App() {
  // Link de redefinição de senha do Firebase aponta para a própria origem
  // do app (ver adminSdk.ts) — se a URL trouxer esse código, mostramos a
  // tela de redefinição em vez do fluxo normal de login/autenticação.
  const params = new URLSearchParams(window.location.search);
  const oobCode = params.get('oobCode');
  if (params.get('mode') === 'resetPassword' && oobCode) {
    return <ResetPasswordScreen oobCode={oobCode} />;
  }

  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const { session, authLoading } = useAuth();
  // Para o admin, a checagem de seed inicial dos dados atrasa o fim do
  // authLoading mesmo com a sessão já carregada — passar o nome aqui evita
  // que a tela de boas-vindas pareça "sumir" nesse intervalo.
  if (authLoading) return <LoadingScreen displayName={session?.displayName} />;
  if (!session) return <LoginScreen />;
  if (session.mustChangePassword) return <FirstAccessScreen />;
  return <AppInner />;
}

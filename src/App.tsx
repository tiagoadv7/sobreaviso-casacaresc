import React, { useState, useEffect } from 'react';
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
} from './firebase/db';

import { AuthProvider, useAuth } from './auth/AuthContext';

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoginScreen } from './components/LoginScreen';
import { ResetPasswordScreen } from './components/ResetPasswordScreen';
import { DashboardView } from './components/DashboardView';
import { EscalaView } from './components/EscalaView';
import { DemandasView } from './components/DemandasView';
import { CalculoHorasView } from './components/CalculoHorasView';
import { ColaboradoresView } from './components/ColaboradoresView';
import { AdminView } from './components/AdminView';

import { DayModal } from './components/modals/DayModal';
import { DemandModal } from './components/modals/DemandModal';
import { CollaboratorModal } from './components/modals/CollaboratorModal';
import { ProfileModal } from './components/modals/ProfileModal';

/* ─── Loading screen ─── */
function LoadingScreen() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center gap-4"
      style={{ background: 'linear-gradient(135deg, #084F42 0%, #1e1e1c 50%, #084F42 100%)' }}
    >
      <div className="w-12 h-12 border-4 border-white/20 border-t-[#6BC0B2] rounded-full animate-spin" />
      <p className="text-white/70 text-sm font-medium">Carregando…</p>
    </div>
  );
}

/* ─── Inner app (requires auth) ─── */
function AppInner() {
  const { session, isAdmin } = useAuth();
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

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
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
    showToast('Plantão removido do dia.');
  };

  const handleOpenNewCallForDay = (day: number, collaboratorId: string) => {
    setEditingCall(null);
    setPresetDayForCall(day);
    setPresetCollabForCall(collaboratorId);
    setIsDemandModalOpen(true);
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

  const handleDeleteCall = async (callId: string) => {
    if (!window.confirm('Deseja excluir este registro de demanda?')) return;
    await dbDeleteCall(callId);
    showToast('Demanda excluída.');
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

  const handleDeleteCollaborator = async (collabId: string) => {
    if (!isAdmin) return;
    const target = collaborators.find((c) => c.id === collabId);
    if (!target) return;
    if (!window.confirm(`Deseja realmente excluir ${target.name}?`)) return;
    await dbDeleteCollaborator(collabId);
    showToast('Colaborador excluído.');
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
      const headers = ['Dia', 'Data', 'Colaborador', 'Demanda', 'Contato', 'Beneficiário', 'Motivo', 'Início', 'Fim', 'Status'];
      const rows: (string | number)[][] = calls.map((c) => {
        const collab = collaborators.find((x) => x.id === c.collaboratorId);
        const demand = demandTypes.find((x) => x.id === c.demandTypeId);
        return [c.day, `${currentYear}-${pad(currentMonth + 1)}-${pad(c.day)}`,
          collab?.name || '-', demand?.label || '-', c.contato || '-',
          c.beneficiario || '-', c.motivo || '-', c.inicio || '-', c.fim || '-',
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
      return [d.day, d.date, d.weekdayLabel, `Semana ${d.weekIndex}`,
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

  if (dataLoading) return <LoadingScreen />;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full bg-[#edf2f7] text-[#0b0b0b] font-sans antialiased selection:bg-[#319685]/20 overflow-hidden">
      <Sidebar
        currentTab={safeTab}
        onSelectTab={handleSelectTab}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0 my-3 mr-3 bg-white rounded-[28px] border border-black/[0.08] shadow-sm overflow-hidden h-[calc(100vh-24px)]">
        <TopBar
          currentTab={safeTab}
          currentYear={currentYear}
          currentMonth={currentMonth}
          role={role}
          onExport={handleExport}
          onPrint={handlePrint}
          onOpenNewCallModal={() => handleOpenCallModal()}
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
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectMonth={setCurrentMonth}
              onSelectYear={setCurrentYear}
              onGoToToday={handleGoToToday}
              onOpenDayModal={handleOpenDayModal}
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
      <DemandModal
        isOpen={isDemandModalOpen}
        editingCall={editingCall}
        presetDay={presetDayForCall}
        presetCollabId={presetCollabForCall}
        collaborators={collaborators}
        demandTypes={demandTypes}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onClose={() => setIsDemandModalOpen(false)}
        onSaveCall={handleSaveCall}
        onAddNewDemandType={handleAddNewDemandType}
      />
      <CollaboratorModal
        isOpen={isCollabModalOpen}
        editingCollab={editingCollab}
        onClose={() => setIsCollabModalOpen(false)}
        onSaveCollaborator={handleSaveCollaborator}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        collaborator={ownCollaborator}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleSaveProfile}
      />

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-2.5 rounded-full text-xs font-semibold shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
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
  if (authLoading) return <LoadingScreen />;
  if (!session) return <LoginScreen />;
  return <AppInner />;
}

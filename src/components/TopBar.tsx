import React, { useEffect, useRef, useState } from 'react';
import { TabView, UserRole } from '../types';
import { Download, Printer, Plus, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import { monthLabel } from '../utils/calc';

interface TopBarProps {
  currentTab: TabView;
  currentYear: number;
  currentMonth: number;
  role: UserRole;
  onExport: (format: 'csv' | 'excel') => void;
  onPrint: () => void;
  onOpenNewCollaboratorModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  currentYear,
  currentMonth,
  role,
  onExport,
  onPrint,
  onOpenNewCollaboratorModal,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };
    if (isExportOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportOpen]);

  const handlePickFormat = (format: 'csv' | 'excel') => {
    setIsExportOpen(false);
    onExport(format);
  };
  const titles: Record<TabView, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: monthLabel(currentMonth, currentYear),
    },
    escala: {
      title: 'Escala do mês',
      subtitle: `${monthLabel(currentMonth, currentYear)} · clique em um dia para ver detalhes e editar`,
    },
    chamados: {
      title: 'Demandas',
      subtitle: `Registro de demandas atendidas · ${monthLabel(currentMonth, currentYear)}`,
    },
    'calculo-horas': {
      title: 'Cálculo de horas',
      subtitle: `Horas extras a partir dos atendimentos · ${monthLabel(currentMonth, currentYear)}`,
    },
    colaboradores: {
      title: 'Colaboradores',
      subtitle: `Equipe de sobreaviso · ${monthLabel(currentMonth, currentYear)}`,
    },
    admin: {
      title: 'Painel Admin',
      subtitle: 'Gerencie usuários, senhas e colaboradores do sistema',
    },
  };

  const currentInfo = titles[currentTab];
  const isAdmin = role === 'admin';

  return (
    <header className="px-4 sm:px-7 py-4 bg-white rounded-t-[28px] shrink-0">
      {/* Logo — só no mobile, acima e centralizada */}
      <div className="lg:hidden flex justify-center pb-3">
        <img src="/logo.svg" alt="Casacaresc" className="w-32 h-auto" />
      </div>

      <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-center gap-3 min-w-0 text-center">
        <div className="min-w-0">
          <h1 id="page-title" className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight truncate">
            {currentInfo.title}
          </h1>
          <p id="page-subtitle" className="text-xs text-neutral-500 mt-0.5 font-medium truncate">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2.5 flex-wrap">
        {/* Adicionar colaborador — apenas admin na aba colaboradores */}
        {currentTab === 'colaboradores' && isAdmin && (
          <button
            id="btn-add-collab"
            type="button"
            onClick={onOpenNewCollaboratorModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-[#319685] text-white hover:bg-[#084F42] shadow-sm shadow-[#319685]/30 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Adicionar colaborador</span>
          </button>
        )}

        {/* Export e Imprimir — somente quando não estiver no painel admin */}
        {currentTab !== 'admin' && (
          <>
            <div ref={exportRef} className="relative">
              <button
                id="btn-export"
                type="button"
                onClick={() => setIsExportOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium bg-[#fcfcfb] text-neutral-800 border border-black/10 hover:bg-[#f4f4f1] transition-all duration-200 cursor-pointer shadow-2xs active:scale-[0.97]"
              >
                <Download className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span>Exportar</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-30 w-48 bg-white border border-black/10 rounded-2xl p-1.5 shadow-xl shadow-black/10 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    id="btn-export-excel"
                    type="button"
                    onClick={() => handlePickFormat('excel')}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-[#DEEDE0]/50 hover:text-[#084F42] transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#319685]" />
                    <span>Exportar Excel (.xlsx)</span>
                  </button>
                  <button
                    id="btn-export-csv"
                    type="button"
                    onClick={() => handlePickFormat('csv')}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-[#DEEDE0]/50 hover:text-[#084F42] transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span>Exportar CSV</span>
                  </button>
                </div>
              )}
            </div>

            <button
              id="btn-print-pdf"
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-medium bg-neutral-900 text-white hover:bg-neutral-800 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              <span>Imprimir / PDF</span>
            </button>
          </>
        )}
      </div>
      </div>

      {/* Divisor suave, com pontas arredondadas, em vez de uma linha reta
          de ponta a ponta — evita o corte "quadrado" entre o cabeçalho e o
          conteúdo abaixo. */}
      <div className="flex justify-center pt-4">
        <div className="w-12 h-1 rounded-full bg-black/[0.06]" />
      </div>
    </header>
  );
};

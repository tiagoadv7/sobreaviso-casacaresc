import React, { useState } from 'react';
import { TabView, UserRole } from '../types';
import {
  LayoutGrid,
  Calendar,
  PhoneCall,
  Sigma,
  Users,
  ShieldCheck,
  LogOut,
  UserCircle,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface SidebarProps {
  currentTab: TabView;
  onSelectTab: (tab: TabView) => void;
  onOpenProfile: () => void;
}

interface NavItem {
  id: TabView;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutGrid className="w-4 h-4" />,
    allowedRoles: ['admin', 'colaborador'],
  },
  {
    id: 'escala',
    label: 'Escala do mês',
    icon: <Calendar className="w-4 h-4" />,
    allowedRoles: ['admin', 'colaborador'],
  },
  {
    id: 'chamados',
    label: 'Cadastrar Demandas',
    icon: <PhoneCall className="w-4 h-4" />,
    allowedRoles: ['admin', 'colaborador'],
  },
  {
    id: 'calculo-horas',
    label: 'Cálculo de horas',
    icon: <Sigma className="w-4 h-4" />,
    allowedRoles: ['admin'],
  },
  {
    id: 'colaboradores',
    label: 'Colaboradores',
    icon: <Users className="w-4 h-4" />,
    allowedRoles: ['admin'],
  },
  {
    id: 'admin',
    label: 'Painel Admin',
    icon: <ShieldCheck className="w-4 h-4" />,
    allowedRoles: ['admin'],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenProfile }) => {
  const { session, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const role = session?.role ?? 'colaborador';

  const visibleItems = ALL_NAV_ITEMS.filter((item) => item.allowedRoles.includes(role));

  // Separate admin item from the rest
  const mainItems = visibleItems.filter((i) => i.id !== 'admin');
  const adminItem = visibleItems.find((i) => i.id === 'admin');

  const handleLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const initials = (session?.displayName ?? 'U')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <aside className="w-64 shrink-0 p-4 flex flex-col justify-between h-screen bg-transparent select-none">
      <div>
        {/* Brand */}
        <div className="flex flex-col items-center gap-2 px-2 pt-2 pb-6 text-center">
          <img src="/logo.svg" alt="Casacaresc" className="w-36 h-auto" />
          <div className="text-[15px] font-bold text-[#084F42] tracking-tight leading-tight">
            Sobreaviso
          </div>
        </div>

        {/* Nav Section Label */}
        <div className="text-[11px] font-semibold text-[#084F42]/60 uppercase tracking-wider px-3 py-2">
          Menu Principal
        </div>

        <nav className="flex flex-col gap-1">
          {mainItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-200 ease-out active:scale-[0.97] active:duration-75 ${
                  isActive
                    ? 'bg-[#319685]/15 text-[#084F42] font-bold shadow-2xs border border-[#319685]/20'
                    : 'text-neutral-600 border border-transparent hover:bg-[#DEEDE0]/60 hover:text-[#084F42] hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`transition-colors duration-200 ${isActive ? 'text-[#319685]' : 'text-neutral-400'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Admin Section */}
        {adminItem && (
          <>
            <div className="text-[11px] font-semibold text-[#084F42]/70 uppercase tracking-wider px-3 py-2 mt-4">
              Administração
            </div>
            <nav className="flex flex-col gap-1">
              <button
                key={adminItem.id}
                id={`nav-btn-${adminItem.id}`}
                type="button"
                onClick={() => onSelectTab(adminItem.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-sm font-medium cursor-pointer transition-all duration-200 ease-out active:scale-[0.97] active:duration-75 ${
                  currentTab === adminItem.id
                    ? 'bg-[#084F42] text-white font-semibold shadow-md shadow-[#084F42]/20'
                    : 'text-neutral-600 hover:bg-[#DEEDE0]/70 hover:text-[#084F42] hover:translate-x-0.5'
                }`}
              >
                <span className={`transition-colors duration-200 ${currentTab === adminItem.id ? 'text-[#6BC0B2]' : 'text-neutral-400'}`}>
                  {adminItem.icon}
                </span>
                <span>{adminItem.label}</span>
              </button>
            </nav>
          </>
        )}
      </div>

      {/* Footer: user info + profile + logout */}
      <div className="space-y-2">
        {/* User card */}
        <div className="bg-white/90 border border-[#319685]/15 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                role === 'admin'
                  ? 'bg-[#084F42] text-white'
                  : 'bg-[#319685]/15 text-[#319685]'
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-neutral-900 truncate">
                {session?.displayName ?? 'Usuário'}
              </p>
              <p className="text-[10px] text-neutral-500 truncate">
                {role === 'admin' ? '🛡️ Administrador' : '👤 Colaborador'}
              </p>
            </div>
          </div>

          <div className="flex gap-1.5">
            {/* Minha conta / Senha — visível para todos */}
            <button
              id="btn-open-profile"
              type="button"
              onClick={onOpenProfile}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border border-black/10 text-[11px] font-semibold text-neutral-700 hover:bg-[#DEEDE0]/50 hover:text-[#084F42] transition-all duration-200 ease-out cursor-pointer active:scale-[0.96] active:duration-75"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#319685]" />
              Minha conta
            </button>

            {/* Logout */}
            <button
              id="btn-logout"
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl border border-[#E84A4E]/20 text-[11px] font-semibold text-[#E84A4E] hover:bg-[#E84A4E]/10 transition-all duration-200 ease-out cursor-pointer active:scale-[0.96] active:duration-75"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>

        <div className="text-[10px] text-[#084F42]/50 text-center px-2">
          Sobreaviso · Casacaresc
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pb-6 sm:items-center sm:pb-0 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-black/8 w-full max-w-xs mx-4 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Icon + Title */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E84A4E]/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#E84A4E]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Sair do sistema?</h3>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  Você será desconectado e precisará fazer login novamente para acessar.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                id="btn-logout-cancel"
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-2xl border border-black/10 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-all duration-200 ease-out cursor-pointer active:scale-[0.97] active:duration-75"
              >
                Cancelar
              </button>
              <button
                id="btn-logout-confirm"
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-2xl bg-[#E84A4E] text-white text-xs font-bold hover:bg-[#d03d41] shadow-md shadow-[#E84A4E]/25 transition-all duration-200 ease-out cursor-pointer active:scale-[0.97] active:duration-75 flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

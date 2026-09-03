import { useState } from 'react';
import { 
  Users, Activity, CalendarDays, Wallet, LayoutGrid, BarChart3, Menu, X, 
  ClipboardList, LogOut, Settings as SettingsIcon, UserCheck, ChevronRight, ChevronLeft
} from 'lucide-react';

const NAV_GROUPS = [
  {
    title: 'GENEL',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
      { id: 'requests', label: 'Randevu Talepleri', icon: ClipboardList },
    ]
  },
  {
    title: 'KLİNİK YÖNETİMİ',
    items: [
      { id: 'sessions', label: 'Seans Takvimi', icon: CalendarDays },
      { id: 'patients', label: 'Hasta Yönetimi', icon: Users },
      { id: 'treatments', label: 'Tedavi & Hizmetler', icon: Activity },
      { id: 'staff', label: 'Ekip & Personel', icon: UserCheck },
    ]
  },
  {
    title: 'FİNANS & RAPOR',
    items: [
      { id: 'payments', label: 'Ödemeler & Kasa', icon: Wallet },
      { id: 'reports', label: 'İstatistik & Rapor', icon: BarChart3 },
    ]
  },
  {
    title: 'SİSTEM',
    items: [
      { id: 'settings', label: 'Klinik Ayarları', icon: SettingsIcon },
    ]
  }
];

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen, onLogout, pendingCount = 0, clinic }) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('fizyo_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('fizyo_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const renderSidebarContent = (isCollapsed, isMobile = false) => (
    <>
      {/* ─── Top Brand Header ─── */}
      <div className={`h-16 flex items-center border-b border-gray-100 shrink-0 bg-white transition-all ${
        isCollapsed ? 'justify-center px-2' : 'justify-between px-4'
      }`}>
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0">
              {clinic?.logo_url ? (
                <img src={clinic.logo_url} alt="Logo" className="w-8 h-8 rounded-xl object-contain shadow-2xs border border-gray-100 shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs text-white shrink-0 font-black text-[13px] tracking-tight">
                  FT
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[14px] font-black text-slate-900 tracking-tight block truncate">
                  {clinic?.name || 'Fizyotim'}
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                  KLİNİK YÖNETİM SİSTEMİ
                </span>
              </div>
            </div>

            {isMobile ? (
              <button 
                onClick={() => setMobileOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18}/>
              </button>
            ) : (
              <button 
                onClick={toggleCollapse} 
                title="Menüyü Daralt"
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
              >
                <ChevronLeft size={16} />
              </button>
            )}
          </>
        ) : (
          <button
            onClick={toggleCollapse}
            title="Menüyü Genişlet"
            className="group/toggle relative flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 transition-all cursor-pointer"
          >
            {clinic?.logo_url ? (
              <img src={clinic.logo_url} alt="Logo" className="w-7 h-7 rounded-lg object-contain shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs text-white shrink-0 font-black text-[13px] tracking-tight">
                FT
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-xs group-hover/toggle:scale-110 transition-transform">
              <ChevronRight size={10} strokeWidth={3} />
            </div>
          </button>
        )}
      </div>

      {/* ─── Navigation Menu with Categories ─── */}
      <nav className={`flex-1 ${isCollapsed ? 'px-2 py-3 space-y-1.5 overflow-visible' : 'px-3 py-3 space-y-4 overflow-y-auto'}`}>
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={group.title} className="space-y-0.5">
            {!isCollapsed ? (
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
                {group.title}
              </div>
            ) : (
              gIdx > 0 && <div className="my-2 border-t border-gray-100 mx-2" />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = item.id === 'requests' && pendingCount > 0;

              return (
                <div key={item.id} className="relative group">
                  <button
                    onClick={() => { setActiveTab(item.id); if (isMobile) setMobileOpen(false); }}
                    title={isCollapsed ? item.label : undefined}
                    className={`relative flex items-center transition-all duration-150 cursor-pointer ${
                      isCollapsed
                        ? `w-10 h-10 mx-auto justify-center rounded-xl ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-700 font-bold shadow-2xs border border-emerald-200/60' 
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                          }`
                        : `w-full gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium ${
                            isActive 
                              ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs' 
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`
                    }`}
                  >
                    {/* Active Indicator Strip (Expanded mode) */}
                    {!isCollapsed && isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-600 rounded-r-full" />
                    )}

                    <div className={`shrink-0 transition-colors ${
                      isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`}>
                      <Icon size={isCollapsed ? 18 : 17} strokeWidth={isActive ? 2.3 : 1.8} />
                    </div>

                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate">{item.label}</span>
                    )}

                    {/* Pending Requests Badge */}
                    {showBadge && (
                      isCollapsed ? (
                        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse">
                          {pendingCount > 9 ? '9+' : pendingCount}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center h-5 px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-xs animate-pulse">
                          {pendingCount > 9 ? '9+' : pendingCount}
                        </span>
                      )
                    )}
                  </button>

                  {/* ── Floating Tooltip when Collapsed ── */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-[12px] font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 flex items-center gap-2">
                      <span>{item.label}</span>
                      {showBadge && (
                        <span className="h-4 px-1.5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                          {pendingCount}
                        </span>
                      )}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ─── Bottom User Profile & Logout ─── */}
      <div className={`border-t border-gray-100 bg-gray-50/50 shrink-0 ${
        isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3'
      }`}>
        {!isCollapsed ? (
          <>
            <div className="p-2.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-[12px] flex items-center justify-center shrink-0 border border-emerald-200">
                  {clinic?.owner_name ? clinic.owner_name.charAt(0).toUpperCase() : 'K'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold text-gray-800 truncate leading-tight">
                    {clinic?.owner_name || 'Klinik Yöneticisi'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-gray-500 font-medium capitalize truncate">
                      {clinic?.city ? `${clinic.city}` : 'Aktif Hesap'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl text-[12px] font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all cursor-pointer"
            >
              <LogOut size={15} />
              <span>Güvenli Çıkış</span>
            </button>
          </>
        ) : (
          <>
            {/* Collapsed Profile Icon with Tooltip */}
            <div className="relative group">
              <div 
                className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-[13px] flex items-center justify-center border border-emerald-200 cursor-default"
                title={clinic?.owner_name || 'Klinik Yöneticisi'}
              >
                {clinic?.owner_name ? clinic.owner_name.charAt(0).toUpperCase() : 'K'}
              </div>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-[12px] font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
                <p className="font-bold">{clinic?.owner_name || 'Klinik Yöneticisi'}</p>
                <p className="text-[10px] text-slate-400">{clinic?.name || 'Fizyotim Pro'}</p>
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </div>

            {/* Collapsed Logout Button with Tooltip */}
            <div className="relative group">
              <button
                onClick={onLogout}
                title="Güvenli Çıkış"
                className="w-10 h-10 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 flex items-center justify-center cursor-pointer transition-colors"
              >
                <LogOut size={16} />
              </button>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-[12px] font-semibold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50">
                Güvenli Çıkış
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop collapsible sidebar */}
      <aside className={`hidden md:flex min-h-screen bg-white border-r border-gray-200/80 flex-col shrink-0 select-none z-30 transition-all duration-200 ease-in-out ${
        collapsed ? 'w-[70px] overflow-visible' : 'w-[240px] overflow-hidden'
      }`}>
        {renderSidebarContent(collapsed, false)}
      </aside>

      {/* Mobile drawer (Always expanded) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[270px] bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {renderSidebarContent(false, true)}
          </aside>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onClick }) {
  return (
    <button 
      onClick={onClick} 
      className="md:hidden w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:bg-gray-50 mr-3 cursor-pointer shadow-2xs"
    >
      <Menu size={18} />
    </button>
  );
}

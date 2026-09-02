import { 
  Users, Activity, CalendarDays, Wallet, LayoutGrid, BarChart3, Menu, X, ClipboardList, Building2, LogOut, Settings as SettingsIcon, UserCheck, ShieldCheck, ChevronRight
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
  const content = (
    <>
      {/* ─── Top Brand Header ─── */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-gray-100 shrink-0 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          {clinic?.logo_url ? (
            <img src={clinic.logo_url} alt="Logo" className="w-8 h-8 rounded-xl object-contain shadow-2xs border border-gray-100 shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white shrink-0">
              <Activity size={17} strokeWidth={2.5} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-[14px] font-black text-gray-900 tracking-tight block truncate">
              {clinic?.name || 'Fizyotim'}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
              Fizyotim Pro
            </span>
          </div>
        </div>
        {/* Mobile close */}
        <button 
          onClick={() => setMobileOpen(false)} 
          className="md:hidden text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={18}/>
        </button>
      </div>

      {/* ─── Navigation Menu with Categories ─── */}
      <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const showBadge = item.id === 'requests' && pendingCount > 0;

              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
                  className={`w-full group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-50 text-emerald-800 font-bold shadow-2xs' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {/* Active Indicator Strip */}
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-600 rounded-r-full" />
                  )}

                  <div className={`shrink-0 transition-colors ${
                    isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`}>
                    <Icon size={17} strokeWidth={isActive ? 2.3 : 1.8} />
                  </div>

                  <span className="flex-1 text-left truncate">{item.label}</span>

                  {showBadge && (
                    <span className="inline-flex items-center justify-center h-5 px-1.5 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-xs animate-pulse">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ─── Bottom User Profile & Logout ─── */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
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
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] min-h-screen bg-white border-r border-gray-200/80 flex-col shrink-0 select-none">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[270px] bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
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

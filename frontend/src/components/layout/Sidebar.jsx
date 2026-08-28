import { 
  Users, Activity, CalendarDays, Wallet, LayoutGrid, BarChart3, Menu, X, ClipboardList, Building2, LogOut
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'patients', label: 'Hastalar', icon: Users },
  { id: 'sessions', label: 'Seanslar', icon: CalendarDays },
  { id: 'treatments', label: 'Tedaviler', icon: Activity },
  { id: 'payments', label: 'Ödemeler', icon: Wallet },
  { id: 'reports', label: 'Raporlar', icon: BarChart3 },
  { id: 'requests', label: 'Talepler', icon: ClipboardList },
];

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen, onLogout, pendingCount = 0, clinic }) {
  const content = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs">
            <Activity size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[14px] font-bold text-gray-900 tracking-tight">FizyoPanel</span>
        </div>
        {/* Mobile close */}
        <button onClick={() => setMobileOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
          <X size={20}/>
        </button>
      </div>

      {/* Clinic Badge */}
      {clinic && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100/80 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <Building2 size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-gray-800 truncate">{clinic.name || 'Klinik'}</p>
            <p className="text-[10px] text-emerald-600 font-medium capitalize truncate">{clinic.plan || 'Standart'} Plan</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2.5 space-y-0.5 mt-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showBadge = item.id === 'requests' && pendingCount > 0;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-2xs' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{item.label}</span>
              {showBadge && (
                <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2.5 border-t border-gray-100 shrink-0">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] min-h-screen bg-white border-r border-gray-200/80 flex-col shrink-0">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-white flex flex-col shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}

// Mobile hamburger for Header
export function MobileMenuButton({ onClick }) {
  return (
    <button onClick={onClick} className="md:hidden w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 mr-3">
      <Menu size={18} />
    </button>
  );
}

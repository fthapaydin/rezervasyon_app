import { 
  Users, 
  Activity, 
  CalendarDays, 
  Wallet, 
  LayoutGrid,
  LogOut
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'patients', label: 'Hastalar', icon: Users },
  { id: 'sessions', label: 'Seanslar', icon: CalendarDays },
  { id: 'treatments', label: 'Tedaviler', icon: Activity },
  { id: 'payments', label: 'Ödemeler', icon: Wallet },
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-[260px] min-h-screen bg-white border-r border-gray-200/80 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Activity size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[15px] font-bold text-gray-900 tracking-tight">FizyoPanel</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 mt-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                isActive 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
            FT
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-gray-800 truncate">Fizyoterapist</p>
            <p className="text-[11px] text-gray-400">Yönetici</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

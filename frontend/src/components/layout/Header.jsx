import { RefreshCw, LogOut } from 'lucide-react';
import { MobileMenuButton } from './Sidebar';

export default function Header({ title, subtitle, onRefresh, onMenuClick, onLogout }) {
  return (
    <header className="h-14 bg-white border-b border-gray-200/80 px-4 md:px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center">
        <MobileMenuButton onClick={onMenuClick} />
        <div>
          <h1 className="text-[14px] md:text-[15px] font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRefresh} className="h-8 px-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 text-[12px] font-medium flex items-center gap-1.5 transition-colors">
          <RefreshCw size={13}/> <span className="hidden sm:inline">Yenile</span>
        </button>
      </div>
    </header>
  );
}

import { RefreshCw } from 'lucide-react';

export default function Header({ title, subtitle, onRefresh }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200/80 px-8 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-[15px] font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-[12px] text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <button 
        onClick={onRefresh} 
        className="h-8 px-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 text-[12px] font-medium flex items-center gap-1.5 transition-colors"
      >
        <RefreshCw size={13} />
        Yenile
      </button>
    </header>
  );
}

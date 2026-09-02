import { Inbox, Plus } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Kayıt bulunamadı',
  description = 'Henüz burada listelenecek bir kayıt bulunmuyor.',
  actionText,
  onAction,
  iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-50 border-emerald-100',
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl bg-white border border-dashed border-gray-200">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${iconBg} ${iconColor} shadow-2xs`}>
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <h3 className="text-[15px] font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-[13px] text-gray-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold shadow-md shadow-emerald-200 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}

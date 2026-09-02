import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Emin misiniz?',
  message = 'Bu işlemi geri alamazsınız. Devam etmek istediğinize emin misiniz?',
  confirmText = 'Evet, Onayla',
  cancelText = 'Vazgeç',
  type = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false
}) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger 
                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                : isWarning 
                  ? 'bg-amber-50 text-amber-600 border border-amber-100'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
            }`}>
              {isDanger ? (
                <Trash2 size={20} />
              ) : isWarning ? (
                <AlertTriangle size={20} />
              ) : (
                <Info size={20} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-[16px] font-bold text-gray-900 leading-tight">
                {title}
              </h3>
              <p className="text-[13px] text-gray-500 mt-2 leading-relaxed">
                {message}
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 px-4 rounded-xl text-[13px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`h-10 px-5 rounded-xl text-[13px] font-bold text-white shadow-sm transition-all flex items-center gap-2 cursor-pointer ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  : isWarning
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              } disabled:opacity-50`}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Check } from 'lucide-react';

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu;
function cleanText(text) {
  if (!text) return '';
  return String(text).replace(EMOJI_REGEX, '').replace(/^\s*[-•]\s*/gm, '• ').trim();
}

const TYPE_CONFIG = {
  campaign: {
    badge: 'Kampanya & Fırsat',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  info: {
    badge: 'Sistem Güncellemesi',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  warning: {
    badge: 'Önemli Bildirim',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  success: {
    badge: 'Yeni Özellik',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

export default function AnnouncementsModal({ isOpen, onClose, onPreferenceChange }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'campaign' | 'info' | 'active'
  const [showBanners, setShowBanners] = useState(() => {
    return localStorage.getItem('show_announcement_banners') !== 'false';
  });
  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissed_announcements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!isOpen) return;
    fetchAnnouncements();
  }, [isOpen]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Duyuru yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBannerPreference = (enabled) => {
    setShowBanners(enabled);
    localStorage.setItem('show_announcement_banners', enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('announcement_pref_changed'));
    if (onPreferenceChange) onPreferenceChange(enabled);
  };

  const markAllAsDismissed = () => {
    const allIds = announcements.map(a => a.id);
    setDismissedIds(allIds);
    localStorage.setItem('dismissed_announcements', JSON.stringify(allIds));
    window.dispatchEvent(new Event('announcement_pref_changed'));
  };

  if (!isOpen) return null;

  const filteredAnnouncements = announcements.filter(a => {
    if (filter === 'active') return a.is_active;
    if (filter === 'campaign') return a.type === 'campaign';
    if (filter === 'info') return a.type === 'info' || a.type === 'success';
    return true;
  });

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs font-[Inter] animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50/50">
          <div>
            <h3 className="text-[17px] font-black text-gray-900 tracking-tight leading-tight">
              Duyurular &amp; Güncelleme Geçmişi
            </h3>
            <p className="text-[12px] text-gray-500 mt-0.5">
              Fizyotim yenilikleri, sistem güncellemeleri ve önemli duyurular
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* ─── Banner Display Preference Bar ─── */}
        <div className="px-6 py-3 bg-emerald-50/60 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px]">
          <div className="text-emerald-950 font-medium">
            <span>Yeni duyuruları üst bildirim şeridinde göster:</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => toggleBannerPreference(!showBanners)}
              className={`h-7 px-3 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showBanners 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showBanners && <Check size={12} strokeWidth={3} />}
              <span>{showBanners ? 'Açık (Göster)' : 'Kapalı (Gösterme)'}</span>
            </button>

            <button
              onClick={markAllAsDismissed}
              className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
            >
              Tümünü Okundu Say
            </button>
          </div>
        </div>

        {/* ─── Filter Tabs ─── */}
        <div className="px-6 pt-3 pb-2 border-b border-gray-100 flex items-center gap-2 overflow-x-auto text-[12px] shrink-0">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filter === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            Tüm Duyurular ({announcements.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filter === 'active' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            Aktif Olanlar ({announcements.filter(a => a.is_active).length})
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filter === 'info' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            Güncellemeler ({announcements.filter(a => a.type === 'info' || a.type === 'success').length})
          </button>
          <button
            onClick={() => setFilter('campaign')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filter === 'campaign' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            Kampanyalar ({announcements.filter(a => a.type === 'campaign').length})
          </button>
        </div>

        {/* ─── Content List ─── */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[14px] font-bold text-gray-700">Henüz duyuru bulunmuyor</p>
              <p className="text-[12px] text-gray-400 mt-1">Bu kategoride listelenecek bir bildirim yok.</p>
            </div>
          ) : (
            filteredAnnouncements.map((item) => {
              const typeInfo = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
              const isDismissed = dismissedIds.includes(item.id);
              const formattedDate = item.created_at 
                ? new Date(item.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'Yakın zamanda';

              return (
                <div 
                  key={item.id} 
                  className={`p-5 rounded-2xl border transition-all ${
                    item.is_active 
                      ? 'bg-white border-gray-200/90 shadow-xs hover:border-emerald-300' 
                      : 'bg-gray-50/70 border-gray-200/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeInfo.color}`}>
                        {typeInfo.badge}
                      </span>

                      {item.is_active ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Aktif Duyuru
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Arşiv
                        </span>
                      )}

                      {isDismissed && (
                        <span className="text-[10px] font-medium text-gray-400">
                          (Okundu)
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-gray-400 shrink-0">
                      {formattedDate}
                    </span>
                  </div>

                  <h4 className="text-[15px] font-bold text-gray-900 mb-1.5">
                    {cleanText(item.title)}
                  </h4>

                  <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">
                    {cleanText(item.message)}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0 text-[12px]">
          <span className="text-gray-400 text-[11px]">
            Fizyotim v2.4 Pro Changelog &amp; Bildirim Sistemi
          </span>
          <button
            onClick={onClose}
            className="h-9 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-[12px] transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, Info, AlertTriangle, CheckCircle2, Megaphone, X, ChevronRight } from 'lucide-react';

const TYPE_STYLES = {
  campaign: {
    bg: 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white',
    icon: Sparkles,
    badge: 'KAMPANYA / DUYURU',
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
    icon: Info,
    badge: 'GÜNCELLEME',
  },
  warning: {
    bg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white',
    icon: AlertTriangle,
    badge: 'ÖNEMLİ BİLDİRİM',
  },
  success: {
    bg: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white',
    icon: CheckCircle2,
    badge: 'BİLGİ',
  },
};

export default function AnnouncementBanner({ onOpenModal }) {
  const [announcements, setAnnouncements] = useState([]);
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

  const syncPreferences = () => {
    setShowBanners(localStorage.getItem('show_announcement_banners') !== 'false');
    try {
      const saved = localStorage.getItem('dismissed_announcements');
      setDismissedIds(saved ? JSON.parse(saved) : []);
    } catch {
      setDismissedIds([]);
    }
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err) {
        // Sessiz geç
      }
    };

    fetchAnnouncements();

    // Listen for preference changes from modal/settings
    window.addEventListener('announcement_pref_changed', syncPreferences);

    // Supabase Realtime Subscription for instant announcement updates
    const channel = supabase
      .channel('announcements_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => fetchAnnouncements()
      )
      .subscribe();

    return () => {
      window.removeEventListener('announcement_pref_changed', syncPreferences);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDismiss = (id) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    try {
      // Kalıcı olarak localStorage'a kaydet (bir daha asla gösterilmez)
      localStorage.setItem('dismissed_announcements', JSON.stringify(next));
      window.dispatchEvent(new Event('announcement_pref_changed'));
    } catch {
      // ignore
    }
  };

  // Kullanıcı duyuruları kapattıysa hiçbir şey gösterme
  if (!showBanners) return null;

  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-1 z-30 font-[Inter]">
      {visibleAnnouncements.map((item) => {
        const style = TYPE_STYLES[item.type] || TYPE_STYLES.campaign;
        const Icon = style.icon;

        return (
          <div
            key={item.id}
            className={`${style.bg} px-4 py-2.5 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 duration-200 flex items-center justify-between gap-3 text-[13px]`}
          >
            <div className="flex items-center gap-2.5 max-w-5xl mx-auto flex-1 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Icon size={15} className="text-white" />
              </span>
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/25 uppercase tracking-wider shrink-0">
                  {style.badge}
                </span>
                <strong className="font-bold truncate">{item.title}</strong>
                <span className="text-white/90 hidden sm:inline">—</span>
                <span className="text-white/90 text-[12px] sm:text-[13px] truncate">{item.message}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenModal && (
                <button
                  onClick={onOpenModal}
                  className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <span>Tümünü Gör</span>
                  <ChevronRight size={13} />
                </button>
              )}

              <button
                onClick={() => handleDismiss(item.id)}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                title="Kapat (Bir daha gösterme)"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

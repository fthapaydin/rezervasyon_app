import { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle2, XCircle, Play, RefreshCw, Trash2, 
  ShieldCheck, Database, Calendar, Users, FileSpreadsheet, 
  Clock, Sparkles, X, Terminal, ArrowRight
} from 'lucide-react';
import { runDiagnosticsSuite, seedDemoTestData, clearDemoTestData } from '../../lib/diagnosticsEngine';
import { useToast } from '../ui/Toast';

export default function DiagnosticsModal({ isOpen, onClose, clinic, onRefreshData }) {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (isOpen && results.length === 0) {
      handleRunTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRunTests = async () => {
    setRunning(true);
    setResults([]);
    try {
      const res = await runDiagnosticsSuite(clinic);
      setResults(res);
      const hasError = res.some(r => r.status === 'error');
      if (hasError) {
        toast.error('Bazı test senaryolarında hata tespit edildi.');
      } else {
        toast.success('Tüm özellik testleri başarıyla tamamlandı!');
      }
    } catch (err) {
      toast.error('Test motoru çalışırken hata oluştu: ' + err.message);
    } finally {
      setRunning(false);
    }
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const inserted = await seedDemoTestData(clinic?.id);
      toast.success(`${inserted?.length || 4} adet gerçekçi test seansı takvime ve raporlara eklendi!`, 'Test Verisi Yüklendi');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      toast.error(err.message || 'Demo verisi eklenirken hata oluştu');
    } finally {
      setSeeding(false);
    }
  };

  const handleClearData = async () => {
    setClearing(true);
    try {
      await clearDemoTestData();
      toast.info('Test seansları sistemden temizlendi.', 'Temizlendi');
      if (onRefreshData) onRefreshData();
    } catch (err) {
      toast.error('Temizleme hatası: ' + err.message);
    } finally {
      setClearing(false);
    }
  };

  const passedCount = results.filter(r => r.status === 'success').length;
  const totalCount = results.length;
  const isAllPassed = totalCount > 0 && passedCount === totalCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        
        {/* Başlık Barı */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">Sistem & Özellik Otomatik Teşhis Paneli</h2>
                <span className="px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Canlı Test
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Roller, tedavi atama, seans kopyalama ve raporlama motorunu canlı test edin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Araç Çubuğu / Kontroller */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunTests}
              disabled={running}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Testler Çalışıyor...' : 'Testleri Tekrar Çalıştır'}
            </button>
            <span className="text-xs text-slate-500">
              {totalCount > 0 ? `${passedCount}/${totalCount} Test Başarılı` : 'Hazırlanıyor...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSeedData}
              disabled={seeding}
              title="Takvim ve raporlarda deneme yapabilmeniz için örnek seanslar oluşturur"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {seeding ? 'Ekleniyor...' : 'Örnek Test Verisi Ekle'}
            </button>
            <button
              onClick={handleClearData}
              disabled={clearing}
              title="Oluşturulan test seanslarını siler"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {clearing ? 'Temizleniyor...' : 'Test Verilerini Temizle'}
            </button>
          </div>
        </div>

        {/* Test Sonuçları Listesi */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/30">
          {running && results.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-3" />
              <p className="text-sm font-medium">Özellikler canlı veritabanı ve mantık üzerinde test ediliyor...</p>
              <p className="text-xs text-slate-400 mt-1">RBAC, tedavi atama, seans kopyalama ve raporlama denetleniyor</p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              Henüz test çalıştırılmadı. Yukarıdaki butona basarak başlatın.
            </div>
          ) : (
            results.map((res, idx) => (
              <div
                key={res.id || idx}
                className={`p-4 rounded-xl border transition-all ${
                  res.status === 'success' 
                    ? 'bg-white border-slate-200 hover:border-emerald-300' 
                    : 'bg-rose-50/50 border-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {res.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {idx + 1}. {res.title}
                        </span>
                        <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                          {res.duration}ms
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {res.message}
                      </p>
                    </div>
                  </div>

                  <span className={`text-2xs font-semibold px-2 py-0.5 rounded-md ${
                    res.status === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {res.status === 'success' ? 'BAŞARILI' : 'HATA'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Alt Bilgi & Terminal İpucu */}
        <div className="p-4 bg-slate-900 text-slate-300 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Terminalden otomatik çalıştırmak için:</span>
            <code className="px-2 py-0.5 rounded bg-slate-800 font-mono text-emerald-300 text-2xs">
              npm test
            </code>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
}

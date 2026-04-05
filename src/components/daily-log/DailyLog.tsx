import { useState, useMemo } from 'react';
import { 
  Plus, Calendar, Image as ImageIcon, MessageSquare, 
  Search, MoreVertical, CheckCircle2, BookOpen, X, Upload, AlertTriangle
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useToast } from '../common/Toast';

const STATUS_OPTIONS = ['Normal', 'Warning', 'Kendala'] as const;
type LogStatus = typeof STATUS_OPTIONS[number];

const statusColor: Record<LogStatus, string> = {
  Normal: 'bg-success/10 text-success border-success/20',
  Warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  Kendala: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const DailyLog = () => {
  const { projects, updateProject } = useStore();
  const { showToast } = useToast();
  const [filterText, setFilterText] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [showForm, setShowForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [logText, setLogText] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [logStatus, setLogStatus] = useState<LogStatus>('Normal');
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const allLogs = useMemo(() => {
    return projects.flatMap(p =>
      (p.dailyLogs || []).map(log => ({
        ...log,
        projectName: p.name,
        projectId: p.id,
        status: (log as any).status || 'Normal',
      }))
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projects]);

  const filteredLogs = allLogs.filter(log => {
    const matchText = log.text.toLowerCase().includes(filterText.toLowerCase()) ||
      log.projectName.toLowerCase().includes(filterText.toLowerCase());
    const matchDate = !filterDate || log.date === filterDate;
    const matchStatus = filterStatus === 'Semua Status' || (log as any).status === filterStatus;
    return matchText && matchDate && matchStatus;
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotos(prev => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveLog = async () => {
    if (!logText.trim()) { showToast('Isi catatan tidak boleh kosong', 'warning'); return; }
    if (!selectedProjectId) { showToast('Pilih proyek terlebih dahulu', 'warning'); return; }

    setSaving(true);
    try {
      const project = projects.find(p => p.id === selectedProjectId);
      if (!project) return;

      const newLog = {
        id: Date.now().toString(),
        date: logDate,
        text: logText,
        photos,
        status: logStatus,
      };

      updateProject(selectedProjectId, {
        dailyLogs: [...(project.dailyLogs || []), newLog],
      });

      showToast('Catatan harian berhasil disimpan', 'success');
      setShowForm(false);
      setLogText('');
      setPhotos([]);
      setLogStatus('Normal');
    } catch {
      showToast('Gagal menyimpan catatan', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white italic tracking-tight">Buku Harian Proyek</h2>
          <p className="text-text-secondary mt-1">Catat aktivitas, progress, dan kendala harian</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 group">
          <Plus size={18} className="group-hover:rotate-90 transition-transform" />
          <span>Buat Catatan Harian</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative glass-card w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Catatan Harian Baru</h3>
              <button onClick={() => setShowForm(false)} className="text-text-secondary hover:text-white"><X size={20} /></button>
            </div>

            <div className="space-y-2">
              <label className="text-text-secondary text-sm font-medium">Proyek</label>
              <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none appearance-none">
                {projects.length === 0 && <option value="">Belum ada proyek</option>}
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-text-secondary text-sm font-medium">Tanggal</label>
                <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)}
                  className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-text-secondary text-sm font-medium">Status</label>
                <select value={logStatus} onChange={e => setLogStatus(e.target.value as LogStatus)}
                  className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none appearance-none">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-text-secondary text-sm font-medium">Catatan Aktivitas</label>
              <textarea value={logText} onChange={e => setLogText(e.target.value)} rows={4}
                placeholder="Deskripsikan aktivitas, progress, atau kendala hari ini..."
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none resize-none" />
            </div>

            <div className="space-y-2">
              <label className="text-text-secondary text-sm font-medium">Foto Progress (Opsional)</label>
              <label className="flex items-center gap-3 border-2 border-dashed border-border rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-colors">
                <Upload size={20} className="text-text-secondary" />
                <span className="text-text-secondary text-sm">Klik untuk upload foto</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              </label>
              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={p} className="w-full h-full object-cover" />
                      <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors">
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button>
              <button onClick={handleSaveLog} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {allLogs.length === 0 ? (
        <div className="glass-card p-20 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-glow animate-pulse">
            <BookOpen size={48} />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-2xl font-bold text-white">Buku Harian Kosong</h3>
            <p className="text-text-secondary">Belum ada catatan harian. Klik "Buat Catatan Harian" untuk mulai mencatat progress lapangan.</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Buat Catatan Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-text-secondary uppercase font-bold tracking-widest">Cari Catatan</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                  <input type="text" value={filterText} onChange={e => setFilterText(e.target.value)}
                    placeholder="Cari aktivitas..." className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-primary outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-text-secondary uppercase font-bold tracking-widest">Filter Tanggal</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                  <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-primary outline-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-text-secondary uppercase font-bold tracking-widest">Filter Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-white text-sm focus:border-primary outline-none appearance-none">
                  <option>Semua Status</option>
                  {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="pt-2 border-t border-border text-center">
                <p className="text-text-secondary text-xs">{filteredLogs.length} catatan ditemukan</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-8 relative">
            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border z-0" />
            {filteredLogs.map(log => (
              <div key={log.id} className="relative z-10 flex gap-8 pl-4">
                <div className="w-4 h-4 rounded-full mt-2 ring-4 ring-background bg-primary shadow-glow shrink-0" />
                <div className="flex-1 glass-card p-6 hover:border-primary/30 transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="bg-background border border-border px-3 py-1 rounded-lg">
                        <p className="text-white font-bold text-sm">{log.date}</p>
                      </div>
                      <p className="text-primary text-[10px] font-black uppercase tracking-widest">{log.projectName}</p>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor[(log as any).status as LogStatus] || statusColor.Normal}`}>
                        {(log as any).status || 'Normal'}
                      </span>
                    </div>
                  </div>
                  <p className="text-white text-sm leading-relaxed">{log.text}</p>
                  {log.photos?.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      {log.photos.map((photo, i) => (
                        <div key={i} className="aspect-video rounded-xl overflow-hidden border border-border group relative">
                          <img src={photo} alt="Progress" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon size={24} className="text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-6">
                    <button className="text-text-secondary hover:text-primary flex items-center gap-2 text-xs font-bold transition-colors">
                      <MessageSquare size={14} /> Tambah Catatan
                    </button>
                    <button className="text-text-secondary hover:text-success flex items-center gap-2 text-xs font-bold transition-colors">
                      <CheckCircle2 size={14} /> Verifikasi Progress
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyLog;

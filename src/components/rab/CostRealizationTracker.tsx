import { useState } from 'react';
import { TrendingUp, Plus, Trash2, Camera, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useStore, type CostRealization } from '../../store/useStore';
import { formatCurrency, calculateTotalRAB } from '../../utils/calculations';
import { useToast } from '../common/Toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CostRealizationTrackerProps {
  projectId: string;
}

const CATEGORIES = ['Struktur', 'Dinding', 'Atap', 'Lantai', 'Finishing', 'MEP', 'Upah', 'Material Lain', 'Lainnya'];

const CostRealizationTracker = ({ projectId }: CostRealizationTrackerProps) => {
  const { projects, addCostRealization } = useStore();
  const { showToast } = useToast();
  const project = projects.find(p => p.id === projectId);
  const realizations = project?.costRealizations || [];
  const latestVersion = project?.versions?.[project.versions.length - 1];
  const rabTotal = latestVersion?.summary?.grandTotal || 0;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'Material Lain', description: '', amount: '' });

  const totalRealized = realizations.reduce((s, r) => s + r.amount, 0);
  const remaining = rabTotal - totalRealized;
  const progressPct = rabTotal > 0 ? Math.min(100, (totalRealized / rabTotal) * 100) : 0;

  // Realisasi per kategori
  const byCategory = CATEGORIES.map(cat => ({
    name: cat,
    realisasi: realizations.filter(r => r.category === cat).reduce((s, r) => s + r.amount, 0),
  })).filter(c => c.realisasi > 0);

  const handleSave = () => {
    if (!form.description.trim() || !form.amount) { showToast('Isi semua field', 'warning'); return; }
    addCostRealization(projectId, {
      date: form.date,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
    });
    setForm({ date: new Date().toISOString().split('T')[0], category: 'Material Lain', description: '', amount: '' });
    setShowForm(false);
    showToast('Realisasi biaya dicatat', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" />
          <h3 className="text-white font-bold">Realisasi Biaya vs RAB</h3>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm py-2 flex items-center gap-2">
          <Plus size={14} /> Catat Pengeluaran
        </button>
      </div>

      {/* Progress Bar */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-xs uppercase font-bold tracking-widest">Realisasi vs Anggaran</p>
            <p className="text-white font-black text-2xl mt-1">{progressPct.toFixed(1)}%</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold ${
            progressPct > 100 ? 'bg-red-500/10 border-red-500/20 text-red-400' :
            progressPct > 80 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' :
            'bg-green-500/10 border-green-500/20 text-green-400'
          }`}>
            {progressPct > 100 ? <><AlertTriangle size={14} /> Over Budget</> :
             progressPct > 80 ? <><AlertTriangle size={14} /> Hampir Habis</> :
             <><CheckCircle2 size={14} /> On Budget</>}
          </div>
        </div>
        <div className="w-full h-4 bg-border rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${
            progressPct > 100 ? 'bg-red-500' : progressPct > 80 ? 'bg-yellow-500' : 'bg-primary'
          }`} style={{ width: `${Math.min(100, progressPct)}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-text-secondary text-xs">Total RAB</p>
            <p className="text-white font-bold">{formatCurrency(rabTotal)}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Terpakai</p>
            <p className="text-primary font-bold">{formatCurrency(totalRealized)}</p>
          </div>
          <div>
            <p className="text-text-secondary text-xs">Sisa</p>
            <p className={`font-bold ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(Math.abs(remaining))}</p>
          </div>
        </div>
      </div>

      {/* Chart per kategori */}
      {byCategory.length > 0 && (
        <div className="glass-card p-5">
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-4">Pengeluaran per Kategori</p>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" stroke="#94A3B8" fontSize={10} tickFormatter={v => `${(v/1000000).toFixed(0)}jt`} />
                <YAxis type="category" dataKey="name" stroke="#94A3B8" fontSize={10} width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#121826', border: '1px solid #1E293B', borderRadius: '8px' }}
                  formatter={(v: number) => [formatCurrency(v), 'Realisasi']} />
                <Bar dataKey="realisasi" radius={[0, 4, 4, 0]}>
                  {byCategory.map((_, i) => <Cell key={i} fill={`hsl(${i * 40}, 70%, 60%)`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="glass-card p-5 space-y-4 border-primary/20">
          <h4 className="text-white font-bold text-sm">Catat Pengeluaran Baru</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-bold uppercase tracking-widest">Tanggal</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})}
                className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-bold uppercase tracking-widest">Kategori</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none appearance-none">
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-bold uppercase tracking-widest">Keterangan</label>
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              placeholder="Contoh: Beli semen 50 sak di Toko Bangunan Maju"
              className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-bold uppercase tracking-widest">Jumlah (Rp)</label>
            <input type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
              placeholder="Contoh: 3750000"
              className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button onClick={handleSave} className="btn-primary flex-1 text-sm">Simpan</button>
          </div>
        </div>
      )}

      {/* History */}
      {realizations.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Riwayat Pengeluaran ({realizations.length})</p>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {[...realizations].reverse().map((r: CostRealization) => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-border/10">
                <div>
                  <p className="text-white text-sm font-medium">{r.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{r.category}</span>
                    <span className="text-text-secondary text-xs">{new Date(r.date).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                <p className="text-white font-bold">{formatCurrency(r.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CostRealizationTracker;

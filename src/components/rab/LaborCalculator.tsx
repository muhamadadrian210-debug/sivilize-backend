import { useState } from 'react';
import { Users, Plus, Trash2, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { useStore, type LaborPayment } from '../../store/useStore';
import { formatCurrency } from '../../utils/calculations';
import { useToast } from '../common/Toast';

const DEFAULT_WAGES: Record<string, number> = {
  'Mandor': 270000, 'Kepala Tukang': 230000, 'Tukang Batu': 200000,
  'Tukang Besi': 200000, 'Tukang Kayu': 200000, 'Tukang Cat': 185000,
  'Tukang Pipa': 195000, 'Tukang Listrik': 210000, 'Pekerja': 150000,
};

interface LaborCalculatorProps {
  projectId: string;
}

const LaborCalculator = ({ projectId }: LaborCalculatorProps) => {
  const { projects, addLaborPayment, updateLaborPayment } = useStore();
  const { showToast } = useToast();
  const project = projects.find(p => p.id === projectId);
  const payments = project?.laborPayments || [];

  const [showForm, setShowForm] = useState(false);
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  const [workers, setWorkers] = useState([
    { name: '', role: 'Pekerja', days: 6, dailyWage: 150000 }
  ]);

  const addWorker = () => setWorkers(prev => [...prev, { name: '', role: 'Pekerja', days: 6, dailyWage: 150000 }]);
  const removeWorker = (i: number) => setWorkers(prev => prev.filter((_, idx) => idx !== i));
  const updateWorker = (i: number, field: string, value: string | number) => {
    setWorkers(prev => prev.map((w, idx) => {
      if (idx !== i) return w;
      const updated = { ...w, [field]: value };
      if (field === 'role') updated.dailyWage = DEFAULT_WAGES[value as string] || 150000;
      return updated;
    }));
  };

  const totalAmount = workers.reduce((s, w) => s + w.days * w.dailyWage, 0);

  const handleSave = () => {
    if (!weekStart || !weekEnd) { showToast('Isi tanggal minggu kerja', 'warning'); return; }
    if (workers.some(w => !w.name.trim())) { showToast('Isi nama semua pekerja', 'warning'); return; }
    addLaborPayment(projectId, {
      weekStart, weekEnd,
      workers: workers.map(w => ({ ...w, total: w.days * w.dailyWage })),
      totalAmount,
      paid: false,
    });
    setShowForm(false);
    setWorkers([{ name: '', role: 'Pekerja', days: 6, dailyWage: 150000 }]);
    showToast('Data upah berhasil disimpan', 'success');
  };

  const totalUnpaid = payments.filter(p => !p.paid).reduce((s, p) => s + p.totalAmount, 0);
  const totalPaid = payments.filter(p => p.paid).reduce((s, p) => s + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <h3 className="text-white font-bold">Kalkulator Upah Tenaga Kerja</h3>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm py-2 flex items-center gap-2">
          <Plus size={14} /> Input Upah Minggu Ini
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <p className="text-text-secondary text-xs uppercase font-bold tracking-widest">Total Belum Dibayar</p>
          <p className="text-red-400 font-black text-xl mt-1">{formatCurrency(totalUnpaid)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-secondary text-xs uppercase font-bold tracking-widest">Total Sudah Dibayar</p>
          <p className="text-green-400 font-black text-xl mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-text-secondary text-xs uppercase font-bold tracking-widest">Total Upah</p>
          <p className="text-primary font-black text-xl mt-1">{formatCurrency(totalUnpaid + totalPaid)}</p>
        </div>
      </div>

      {/* Form Input */}
      {showForm && (
        <div className="glass-card p-6 space-y-5 border-primary/20">
          <h4 className="text-white font-bold">Input Upah Mingguan</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-bold uppercase tracking-widest">Tanggal Mulai</label>
              <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
                className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-bold uppercase tracking-widest">Tanggal Selesai</label>
              <input type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)}
                className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-[10px] text-text-secondary uppercase font-bold tracking-widest px-1">
              <span className="col-span-3">Nama</span>
              <span className="col-span-3">Jabatan</span>
              <span className="col-span-2">Hari Kerja</span>
              <span className="col-span-3">Upah/Hari</span>
              <span className="col-span-1"></span>
            </div>
            {workers.map((w, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input value={w.name} onChange={e => updateWorker(i, 'name', e.target.value)}
                  placeholder="Nama tukang"
                  className="col-span-3 h-10 bg-background border border-border rounded-lg px-3 text-white text-sm focus:border-primary outline-none" />
                <select value={w.role} onChange={e => updateWorker(i, 'role', e.target.value)}
                  className="col-span-3 h-10 bg-background border border-border rounded-lg px-3 text-white text-sm focus:border-primary outline-none appearance-none">
                  {Object.keys(DEFAULT_WAGES).map(r => <option key={r}>{r}</option>)}
                </select>
                <input type="number" value={w.days} min={1} max={7} onChange={e => updateWorker(i, 'days', parseInt(e.target.value) || 0)}
                  className="col-span-2 h-10 bg-background border border-border rounded-lg px-3 text-white text-sm focus:border-primary outline-none" />
                <input type="number" value={w.dailyWage} onChange={e => updateWorker(i, 'dailyWage', parseInt(e.target.value) || 0)}
                  className="col-span-3 h-10 bg-background border border-border rounded-lg px-3 text-white text-sm focus:border-primary outline-none" />
                <button onClick={() => removeWorker(i)} className="col-span-1 text-red-400 hover:text-red-300 flex justify-center">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button onClick={addWorker} className="text-primary text-sm font-bold flex items-center gap-1 hover:text-primary-hover transition-colors">
              <Plus size={14} /> Tambah Pekerja
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div>
              <p className="text-text-secondary text-xs">Total Upah Minggu Ini</p>
              <p className="text-primary font-black text-xl">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Batal</button>
              <button onClick={handleSave} className="btn-primary text-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="space-y-3">
          <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Riwayat Pembayaran</p>
          {[...payments].reverse().map((payment: LaborPayment) => (
            <div key={payment.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Clock size={16} className="text-text-secondary" />
                  <div>
                    <p className="text-white font-bold text-sm">
                      {new Date(payment.weekStart).toLocaleDateString('id-ID')} — {new Date(payment.weekEnd).toLocaleDateString('id-ID')}
                    </p>
                    <p className="text-text-secondary text-xs">{payment.workers.length} pekerja</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-white font-black">{formatCurrency(payment.totalAmount)}</p>
                  <button
                    onClick={() => updateLaborPayment(projectId, payment.id, { paid: !payment.paid, paidDate: !payment.paid ? new Date().toISOString().split('T')[0] : undefined })}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      payment.paid
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                    }`}
                  >
                    {payment.paid ? <><CheckCircle2 size={12} /> Lunas</> : <><DollarSign size={12} /> Belum Dibayar</>}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {payment.workers.map((w, i) => (
                  <div key={i} className="bg-background/50 rounded-lg p-2 text-xs">
                    <p className="text-white font-bold">{w.name}</p>
                    <p className="text-text-secondary">{w.role} • {w.days} hari</p>
                    <p className="text-primary font-bold">{formatCurrency(w.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LaborCalculator;

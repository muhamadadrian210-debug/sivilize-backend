import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { type Project } from '../../store/useStore';
import { formatCurrency } from '../../utils/calculations';

interface KurvaSProps {
  project: Project;
}

const KurvaS = ({ project }: KurvaSProps) => {
  const latestVersion = project.versions?.[project.versions.length - 1];
  const items = latestVersion?.rabItems || [];
  const grandTotal = latestVersion?.summary?.grandTotal || 0;

  // Hitung bobot per item berdasarkan total
  const subtotal = items.reduce((s, i) => s + i.total, 0);

  // Distribusi pekerjaan per minggu (estimasi berdasarkan kategori)
  const CATEGORY_WEEK_MAP: Record<string, number[]> = {
    'Persiapan':   [1, 2],
    'Struktur':    [2, 3, 4, 5, 6, 7, 8],
    'Tanah':       [2, 3, 4],
    'Dinding':     [6, 7, 8, 9, 10],
    'Atap':        [9, 10, 11],
    'Arsitektur':  [7, 8, 9, 10, 11, 12],
    'Lantai':      [10, 11, 12],
    'Finishing':   [11, 12, 13, 14, 15, 16],
    'Mekanikal':   [8, 9, 10, 11, 12],
    'Elektrikal':  [10, 11, 12, 13],
    'Sanitasi':    [10, 11, 12],
    'Lain-lain':   [1, 2, 3, 4],
  };

  // Estimasi durasi proyek (minggu)
  const totalArea = project.dimensions.reduce((s, d) => s + d.length * d.width, 0);
  const durationWeeks = Math.max(16, Math.ceil(totalArea / 15));

  const data = useMemo(() => {
    // Distribusi biaya per minggu
    const weeklyBudget: number[] = Array(durationWeeks + 1).fill(0);

    items.forEach(item => {
      const weeks = CATEGORY_WEEK_MAP[item.category] || [1, 2, 3, 4];
      const perWeek = item.total / weeks.length;
      weeks.forEach(w => {
        if (w <= durationWeeks) weeklyBudget[w] += perWeek;
      });
    });

    // Kumulatif rencana
    let cumPlan = 0;
    const result = [];
    for (let w = 0; w <= durationWeeks; w++) {
      cumPlan += weeklyBudget[w];
      const planPercent = grandTotal > 0 ? (cumPlan / grandTotal) * 100 : 0;

      // Realisasi dari daily logs
      const logsUpToWeek = (project.dailyLogs || []).filter(log => {
        if (!project.startDate) return false;
        const start = new Date(project.startDate);
        const logDate = new Date(log.date);
        const weekNum = Math.ceil((logDate.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
        return weekNum <= w;
      });

      const realizationPercent = logsUpToWeek.length > 0
        ? logsUpToWeek[logsUpToWeek.length - 1]?.progressPercent || null
        : null;

      result.push({
        week: `M${w}`,
        rencana: Math.min(100, planPercent),
        realisasi: realizationPercent,
        biayaRencana: cumPlan,
      });
    }
    return result;
  }, [items, project, grandTotal, durationWeeks]);

  // Hitung progress saat ini
  const lastLog = [...(project.dailyLogs || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const currentProgress = lastLog?.progressPercent || 0;

  // Cari minggu saat ini
  const currentWeek = project.startDate
    ? Math.ceil((Date.now() - new Date(project.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : null;

  const planAtCurrentWeek = currentWeek
    ? data[Math.min(currentWeek, data.length - 1)]?.rencana || 0
    : 0;

  const deviation = currentProgress - planAtCurrentWeek;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-white font-bold text-lg">Kurva S — Progress Proyek</h3>
          <p className="text-text-secondary text-xs mt-1">Rencana vs Realisasi pekerjaan</p>
        </div>
        {currentWeek && (
          <div className={`px-4 py-2 rounded-xl border text-sm font-bold ${
            deviation >= 0
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {deviation >= 0 ? '▲' : '▼'} {Math.abs(deviation).toFixed(1)}% {deviation >= 0 ? 'Lebih Cepat' : 'Terlambat'}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total RAB', value: formatCurrency(grandTotal), color: 'text-primary' },
          { label: 'Durasi Rencana', value: `${durationWeeks} Minggu`, color: 'text-blue-400' },
          { label: 'Progress Rencana', value: `${planAtCurrentWeek.toFixed(1)}%`, color: 'text-yellow-400' },
          { label: 'Progress Realisasi', value: `${currentProgress.toFixed(1)}%`, color: deviation >= 0 ? 'text-green-400' : 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="glass-card p-4">
            <p className="text-text-secondary text-xs uppercase font-bold tracking-widest">{s.label}</p>
            <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-6">
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#121826', border: '1px solid #1E293B', borderRadius: '8px' }}
                formatter={(value: number, name: string) => [
                  `${value?.toFixed(1)}%`,
                  name === 'rencana' ? 'Rencana' : 'Realisasi'
                ]}
              />
              <Legend formatter={(value) => value === 'rencana' ? 'Rencana' : 'Realisasi'} />
              {currentWeek && (
                <ReferenceLine x={`M${currentWeek}`} stroke="#FF7A00" strokeDasharray="4 4" label={{ value: 'Hari Ini', fill: '#FF7A00', fontSize: 11 }} />
              )}
              <Line type="monotone" dataKey="rencana" stroke="#3B82F6" strokeWidth={2.5} dot={false} name="rencana" />
              <Line type="monotone" dataKey="realisasi" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} name="realisasi" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-text-secondary text-xs mt-3 text-center italic">
          * Realisasi diambil dari data progress di Buku Harian. Update progress harian untuk akurasi Kurva S.
        </p>
      </div>

      {/* Bobot per kategori */}
      <div className="glass-card p-5">
        <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-4">Bobot Pekerjaan per Kategori</p>
        <div className="space-y-2">
          {Object.entries(
            items.reduce((acc, item) => {
              acc[item.category] = (acc[item.category] || 0) + item.total;
              return acc;
            }, {} as Record<string, number>)
          ).sort((a, b) => b[1] - a[1]).map(([cat, total]) => {
            const pct = subtotal > 0 ? (total / subtotal) * 100 : 0;
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-text-secondary text-xs w-28 shrink-0">{cat}</span>
                <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-white text-xs font-bold w-12 text-right">{pct.toFixed(1)}%</span>
                <span className="text-text-secondary text-xs w-28 text-right">{formatCurrency(total)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default KurvaS;

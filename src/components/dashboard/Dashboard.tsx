import { 
  TrendingUp, 
  Building2, 
  Clock, 
  ArrowUpRight, 
  MoreVertical,
  Briefcase,
  Plus,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { useStore } from '../../store/useStore';
import { formatCurrency } from '../../utils/calculations';
import { getCityDisplayName } from '../../data/prices';

const Dashboard = () => {
  const { projects, setActiveTab, user } = useStore();

  // Calculate real stats
  const totalProjects = projects.length;
  const draftProjects = projects.filter(p => p.status === 'draft').length;
  const totalBudget = projects.reduce((acc, p) => {
    const latestVersion = p.versions?.[p.versions.length - 1];
    return acc + (latestVersion?.summary?.grandTotal || 0);
  }, 0);

  const stats = [
    { label: 'Total Proyek', value: totalProjects.toString(), icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'RAB Draft', value: draftProjects.toString(), icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Anggaran', value: formatCurrency(totalBudget), icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Lokasi Proyek', value: [...new Set(projects.map(p => p.location))].length.toString(), icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  // Dummy chart data for visualization even with 0 projects
  const chartData = [
    { name: 'Jan', total: 0 },
    { name: 'Feb', total: 0 },
    { name: 'Mar', total: totalBudget / 1000000000 }, // in Billions
    { name: 'Apr', total: 0 },
    { name: 'May', total: 0 },
    { name: 'Jun', total: 0 },
  ];

  const recentProjects = [...projects].reverse().slice(0, 3);

  if (projects.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white italic tracking-tight">Gambaran Umum Dasbor</h2>
            <p className="text-text-secondary mt-1">Selamat datang kembali, {user?.name || 'Engineer Admin'}!</p>
          </div>
          <div className="text-right">
            <p className="text-white font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' })}</p>
            <p className="text-text-secondary text-sm">Status: Sistem Online</p>
          </div>
        </div>

        {/* Empty State Card */}
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-glow">
            <Plus size={40} />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-2xl font-bold text-white">Belum Ada Proyek</h3>
            <p className="text-text-secondary">Anda belum memiliki proyek yang terdaftar. Mulai buat RAB profesional pertama Anda sekarang.</p>
          </div>
          <button 
            onClick={() => setActiveTab('kalkulator')}
            className="btn-primary flex items-center gap-2 group"
          >
            <span>Buat Proyek Pertama</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Empty Stats for layout consistency */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 opacity-50 grayscale">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="glass-card p-6 flex items-start justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-white mt-2">{stat.value}</h3>
                </div>
                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                  <Icon size={24} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white italic tracking-tight">Gambaran Umum Dasbor</h2>
          <p className="text-text-secondary mt-1">Selamat datang kembali, {user?.name || 'Engineer Admin'}!</p>
        </div>
        <div className="text-right">
          <p className="text-white font-semibold">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar' })}</p>
          <p className="text-text-secondary text-sm">Status: Sistem Online</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="glass-card p-6 flex items-start justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
                <h3 className="text-2xl font-bold text-white mt-2">{stat.value}</h3>
                <div className="flex items-center gap-1 mt-2 text-success text-xs font-semibold">
                  <ArrowUpRight size={14} />
                  <span>Update real-time</span>
                </div>
              </div>
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white">Statistik Anggaran (Miliar)</h3>
            <select className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-text-secondary outline-none focus:border-primary">
              <option>6 Bulan Terakhir</option>
              <option>1 Tahun Terakhir</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  cursor={{ fill: '#1E293B' }}
                  contentStyle={{ backgroundColor: '#121826', border: '1px solid #1E293B', borderRadius: '8px' }}
                />
                <Bar dataKey="total" fill="#FF7A00" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 2 ? '#FF7A00' : '#FF7A0080'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Recent Activity */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Aktivitas Terbaru</h3>
          <div className="space-y-6 flex-1">
            {projects.length > 0 ? recentProjects.map((p, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-primary">
                  <Building2 size={20} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{p.name}</p>
                  <p className="text-text-secondary text-xs mt-1">Status: {p.status} • {getCityDisplayName(p.location)}</p>
                </div>
              </div>
            )) : (
              <p className="text-text-secondary text-sm italic">Belum ada aktivitas.</p>
            )}
          </div>
          <button className="btn-secondary w-full mt-6" onClick={() => setActiveTab('manajemen')}>Lihat Semua Aktivitas</button>
        </div>
      </div>

      {/* Recent Projects Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Proyek Terbaru</h3>
          <button className="text-primary hover:text-primary-hover text-sm font-semibold" onClick={() => setActiveTab('manajemen')}>Semua Proyek</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-background text-text-secondary text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Nama Proyek</th>
                <th className="px-6 py-4 font-semibold">Lokasi</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Estimasi Biaya</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentProjects.map((project) => {
                const latestVersion = project.versions?.[project.versions.length - 1];
                return (
                  <tr key={project.id} className="hover:bg-border/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{project.name}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{getCityDisplayName(project.location)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        project.status === 'completed' ? 'bg-success/20 text-success' : 
                        project.status === 'draft' ? 'bg-text-secondary/20 text-text-secondary' : 
                        'bg-primary/20 text-primary'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-semibold">
                      {formatCurrency(latestVersion?.summary?.grandTotal || 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-text-secondary hover:text-white transition-colors">
                        <MoreVertical size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

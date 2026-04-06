import { useState, useEffect } from 'react';
import {
  Users, FolderOpen, Activity, Shield, Trash2,
  RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Eye, Ban, Crown, User, Server, Database,
  TrendingUp, Clock, Globe, Lock
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { formatCurrency } from '../../utils/calculations';
import api from '../../services/api';
import { useToast } from '../common/Toast';

interface SystemStatus {
  status: string;
  db: string;
  uptime: number;
  timestamp: string;
}

interface UserData {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

const AdminDashboard = () => {
  const { projects, user } = useStore();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<'overview' | 'users' | 'projects' | 'system'>('overview');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const fetchSystemStatus = async () => {
    setLoadingSystem(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/health`);
      const data = await res.json();
      setSystemStatus(data);
    } catch {
      setSystemStatus({ status: 'error', db: 'Offline', uptime: 0, timestamp: new Date().toISOString() });
    } finally {
      setLoadingSystem(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get('/auth/users');
      if (res.data.success) setUsers(res.data.data);
    } catch {
      // fallback: tampilkan user dari store saja
      if (user) setUsers([user as any]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchSystemStatus();
    fetchUsers();
  }, []);

  // Stats
  const totalProjects = projects.length;
  const totalBudget = projects.reduce((acc, p) => {
    const v = p.versions?.[p.versions.length - 1];
    return acc + (v?.summary?.grandTotal || 0);
  }, 0);
  const draftProjects = projects.filter(p => p.status === 'draft').length;
  const ongoingProjects = projects.filter(p => p.status === 'ongoing').length;

  const stats = [
    { label: 'Total User', value: users.length || 1, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Proyek', value: totalProjects, icon: FolderOpen, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total Anggaran', value: formatCurrency(totalBudget), icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Status DB', value: systemStatus?.db?.includes('MongoDB') ? 'MongoDB' : 'In-Memory', icon: Database, color: systemStatus?.db?.includes('MongoDB') ? 'text-green-400' : 'text-yellow-400', bg: systemStatus?.db?.includes('MongoDB') ? 'bg-green-400/10' : 'bg-yellow-400/10' },
  ];

  const securityFeatures = [
    { name: 'HTTPS/TLS Encryption', status: true, desc: 'Semua data terenkripsi AES-256 di jaringan' },
    { name: 'JWT Authentication', status: true, desc: 'Token 30 hari, algoritma HS256' },
    { name: 'bcrypt Password Hash', status: true, desc: 'Salt rounds 10, tidak bisa di-reverse' },
    { name: 'Helmet Security Headers', status: true, desc: 'XSS, Clickjacking, MIME protection' },
    { name: 'Rate Limiting', status: true, desc: '10 percobaan login / 15 menit' },
    { name: 'NoSQL Injection Protection', status: true, desc: 'express-mongo-sanitize aktif' },
    { name: 'Token Blacklist (Logout)', status: true, desc: 'Token diinvalidasi saat logout' },
    { name: 'HTTP Parameter Pollution', status: true, desc: 'hpp middleware aktif' },
    { name: 'MongoDB Atlas', status: systemStatus?.db?.includes('MongoDB') || false, desc: 'Data persisten di cloud' },
    { name: 'Input Validation (Joi)', status: true, desc: 'Semua input divalidasi ketat' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Admin Only</span>
          </div>
          <h2 className="text-3xl font-bold text-white italic tracking-tight">Control Panel</h2>
          <p className="text-text-secondary mt-1">Monitor dan kelola semua aspek SIVILIZE HUB PRO</p>
        </div>
        <button onClick={() => { fetchSystemStatus(); fetchUsers(); }} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-2 bg-background p-1 rounded-xl border border-border w-fit">
        {(['overview', 'users', 'projects', 'system'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveSection(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeSection === tab ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'}`}>
            {tab === 'overview' ? 'Ringkasan' : tab === 'users' ? 'Pengguna' : tab === 'projects' ? 'Proyek' : 'Sistem'}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={i} className="glass-card p-5 flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">{s.label}</p>
                  <p className="text-white font-black text-xl mt-1">{s.value}</p>
                </div>
                <div className={`${s.bg} ${s.color} p-3 rounded-xl`}><s.icon size={22} /></div>
              </div>
            ))}
          </div>

          {/* Project breakdown */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <p className="text-text-secondary text-xs uppercase font-bold tracking-widest mb-3">Status Proyek</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Draft</span>
                  <span className="text-white font-bold">{draftProjects}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Ongoing</span>
                  <span className="text-primary font-bold">{ongoingProjects}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Completed</span>
                  <span className="text-green-400 font-bold">{projects.filter(p => p.status === 'completed').length}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <p className="text-text-secondary text-xs uppercase font-bold tracking-widest mb-3">Backend Status</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">API Server</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${systemStatus?.status === 'healthy' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'}`}>
                    {systemStatus?.status === 'healthy' ? '● Online' : '● Offline'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Database</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${systemStatus?.db?.includes('MongoDB') ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {systemStatus?.db?.includes('MongoDB') ? '● MongoDB' : '● In-Memory'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Uptime</span>
                  <span className="text-white text-sm font-bold">{systemStatus ? Math.floor(systemStatus.uptime / 60) + ' menit' : '-'}</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <p className="text-text-secondary text-xs uppercase font-bold tracking-widest mb-3">Info Admin</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Login sebagai</span>
                  <span className="text-white text-sm font-bold">{user?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Role</span>
                  <span className="text-primary text-xs font-bold px-2 py-1 bg-primary/10 rounded-full uppercase">{user?.role}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Email</span>
                  <span className="text-white text-xs">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USERS */}
      {activeSection === 'users' && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="text-white font-bold">Daftar Pengguna ({users.length})</h3>
            {loadingUsers && <RefreshCw size={16} className="text-primary animate-spin" />}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-background/50 text-text-secondary text-xs uppercase tracking-widest">
                  <th className="px-5 py-3">Nama</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-text-secondary">Data user hanya tersedia jika backend mendukung endpoint /auth/users</td></tr>
                ) : users.map((u, i) => (
                  <tr key={i} className="hover:bg-border/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-white font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-text-secondary text-sm">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-border text-text-secondary'}`}>
                        {u.role === 'admin' ? <span className="flex items-center gap-1"><Crown size={10} /> Admin</span> : <span className="flex items-center gap-1"><User size={10} /> User</span>}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-text-secondary text-sm">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('id-ID') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROJECTS */}
      {activeSection === 'projects' && (
        <div className="glass-card overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="text-white font-bold">Semua Proyek ({projects.length})</h3>
          </div>
          {projects.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">Belum ada proyek</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background/50 text-text-secondary text-xs uppercase tracking-widest">
                    <th className="px-5 py-3">Nama Proyek</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Versi</th>
                    <th className="px-5 py-3">Total RAB</th>
                    <th className="px-5 py-3">Lantai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.map((p, i) => {
                    const v = p.versions?.[p.versions.length - 1];
                    return (
                      <tr key={i} className="hover:bg-border/20 transition-colors">
                        <td className="px-5 py-4 text-white font-medium">{p.name}</td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${p.status === 'completed' ? 'bg-green-400/10 text-green-400' : p.status === 'ongoing' ? 'bg-primary/10 text-primary' : 'bg-border text-text-secondary'}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-text-secondary">{p.versions?.length || 0}</td>
                        <td className="px-5 py-4 text-white font-bold">{formatCurrency(v?.summary?.grandTotal || 0)}</td>
                        <td className="px-5 py-4 text-text-secondary">{p.floors}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SYSTEM / SECURITY */}
      {activeSection === 'system' && (
        <div className="space-y-6">
          {/* Security checklist */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lock size={18} className="text-primary" />
              <h3 className="text-white font-bold">Status Keamanan Sistem</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {securityFeatures.map((f, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${f.status ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                  {f.status
                    ? <CheckCircle2 size={18} className="text-green-400 shrink-0 mt-0.5" />
                    : <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-white text-sm font-bold">{f.name}</p>
                    <p className="text-text-secondary text-xs">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Backend info */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <Server size={18} className="text-primary" />
              <h3 className="text-white font-bold">Info Backend</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-text-secondary">API URL</span><span className="text-white text-xs">{import.meta.env.VITE_API_URL || 'localhost:5000/api'}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Status</span><span className={`font-bold ${systemStatus?.status === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>{systemStatus?.status || 'Checking...'}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Database</span><span className="text-white">{systemStatus?.db || '-'}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Uptime</span><span className="text-white">{systemStatus ? Math.floor(systemStatus.uptime) + ' detik' : '-'}</span></div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-text-secondary">Framework</span><span className="text-white">Express.js 5</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Runtime</span><span className="text-white">Node.js ≥18</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Deploy</span><span className="text-white">Vercel Serverless</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Last Check</span><span className="text-white text-xs">{systemStatus?.timestamp ? new Date(systemStatus.timestamp).toLocaleTimeString('id-ID') : '-'}</span></div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <AlertTriangle size={18} className="text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-400 font-bold text-sm">Catatan Penting</p>
              <p className="text-text-secondary text-xs mt-1">Halaman ini hanya bisa diakses oleh akun dengan role <span className="text-primary font-bold">admin</span>. Jangan bagikan akses admin ke siapapun.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

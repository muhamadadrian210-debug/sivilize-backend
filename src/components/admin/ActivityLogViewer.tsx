import { useState } from 'react';
import { Clock, User, Trash2, Edit, Plus, Download, LogIn, LogOut, Filter } from 'lucide-react';
import { useStore, type ActivityLog } from '../../store/useStore';

const ACTION_ICONS = {
  create: <Plus size={14} className="text-green-400" />,
  update: <Edit size={14} className="text-blue-400" />,
  delete: <Trash2 size={14} className="text-red-400" />,
  export: <Download size={14} className="text-primary" />,
  login:  <LogIn size={14} className="text-green-400" />,
  logout: <LogOut size={14} className="text-yellow-400" />,
};

const ACTION_COLORS = {
  create: 'bg-green-500/10 text-green-400 border-green-500/20',
  update: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  delete: 'bg-red-500/10 text-red-400 border-red-500/20',
  export: 'bg-primary/10 text-primary border-primary/20',
  login:  'bg-green-500/10 text-green-400 border-green-500/20',
  logout: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

const ActivityLogViewer = () => {
  const { activityLogs, clearActivityLogs } = useStore();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');

  const filtered = activityLogs.filter(log => {
    const matchAction = filterAction === 'all' || log.action === filterAction;
    const matchEntity = filterEntity === 'all' || log.entity === filterEntity;
    return matchAction && matchEntity;
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          <h3 className="text-white font-bold">Audit Trail ({filtered.length} entri)</h3>
        </div>
        <button onClick={clearActivityLogs} className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors">
          Hapus Semua Log
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-secondary" />
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-1.5 text-white text-xs focus:border-primary outline-none">
            <option value="all">Semua Aksi</option>
            <option value="create">Buat</option>
            <option value="update">Update</option>
            <option value="delete">Hapus</option>
            <option value="export">Export</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
        </div>
        <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-1.5 text-white text-xs focus:border-primary outline-none">
          <option value="all">Semua Entitas</option>
          <option value="project">Proyek</option>
          <option value="rab_item">Item RAB</option>
          <option value="daily_log">Buku Harian</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Log List */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-text-secondary">
          <Clock size={32} className="mx-auto mb-3 opacity-30" />
          <p>Belum ada aktivitas tercatat</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filtered.map((log: ActivityLog) => (
            <div key={log.id} className="glass-card p-4 flex items-start gap-4 hover:border-border/60 transition-all">
              <div className="shrink-0 mt-0.5">
                {ACTION_ICONS[log.action]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${ACTION_COLORS[log.action]}`}>
                    {log.action}
                  </span>
                  <span className="text-text-secondary text-[10px] uppercase tracking-widest">{log.entity}</span>
                  <span className="text-white text-xs font-medium truncate">{log.entityName}</span>
                </div>
                <p className="text-text-secondary text-xs">{log.description}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1 text-text-secondary text-[10px]">
                    <User size={10} />
                    <span>{log.userName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-text-secondary text-[10px]">
                    <Clock size={10} />
                    <span>{formatTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityLogViewer;

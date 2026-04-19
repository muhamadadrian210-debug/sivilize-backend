import { Bell, Check, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { useStore, type AppNotification } from '../../store/useStore';

const TYPE_ICON = {
  info:    <Info size={16} className="text-blue-400" />,
  success: <CheckCircle2 size={16} className="text-green-400" />,
  warning: <AlertTriangle size={16} className="text-yellow-400" />,
  error:   <XCircle size={16} className="text-red-400" />,
};

const TYPE_BG = {
  info:    'border-blue-500/20 bg-blue-500/5',
  success: 'border-green-500/20 bg-green-500/5',
  warning: 'border-yellow-500/20 bg-yellow-500/5',
  error:   'border-red-500/20 bg-red-500/5',
};

const NotificationPanel = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications, setActiveTab } = useStore();
  const unread = notifications.filter(n => !n.read).length;

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return new Date(ts).toLocaleDateString('id-ID');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bell size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Notifikasi</h2>
            <p className="text-text-secondary text-sm">{unread > 0 ? `${unread} belum dibaca` : 'Semua sudah dibaca'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={markAllNotificationsRead}
              className="btn-secondary text-sm py-2 flex items-center gap-2">
              <CheckCheck size={16} /> Tandai Semua Dibaca
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearNotifications}
              className="text-sm text-red-400 border border-red-500/20 px-4 py-2 rounded-xl hover:bg-red-500/10 transition-colors flex items-center gap-2">
              <Trash2 size={16} /> Hapus Semua
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="glass-card p-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-border rounded-2xl flex items-center justify-center">
            <Bell size={32} className="text-text-secondary opacity-50" />
          </div>
          <p className="text-white font-bold">Tidak Ada Notifikasi</p>
          <p className="text-text-secondary text-sm">Notifikasi akan muncul saat ada aktivitas baru</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: AppNotification) => (
            <div
              key={notif.id}
              onClick={() => {
                markNotificationRead(notif.id);
                if (notif.projectId) setActiveTab('manajemen');
              }}
              className={`glass-card p-4 flex items-start gap-4 cursor-pointer hover:border-primary/30 transition-all ${
                !notif.read ? 'border-primary/20' : 'opacity-70'
              } ${TYPE_BG[notif.type]}`}
            >
              <div className="shrink-0 mt-0.5">{TYPE_ICON[notif.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`font-bold text-sm ${!notif.read ? 'text-white' : 'text-text-secondary'}`}>
                    {notif.title}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-text-secondary text-[10px]">{formatTime(notif.timestamp)}</span>
                    {!notif.read && <div className="w-2 h-2 bg-primary rounded-full" />}
                  </div>
                </div>
                <p className="text-text-secondary text-xs mt-0.5">{notif.message}</p>
                {notif.projectId && (
                  <div className="flex items-center gap-1 mt-1.5 text-primary text-[10px] font-bold">
                    <ExternalLink size={10} /> Lihat Proyek
                  </div>
                )}
              </div>
              {notif.read && (
                <Check size={14} className="text-text-secondary shrink-0 mt-0.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;

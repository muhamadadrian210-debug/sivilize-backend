/**
 * Bar kecil di atas yang menunjukkan status sinkronisasi data
 */
import { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>(navigator.onLine ? 'synced' : 'offline');

  useEffect(() => {
    const handleOnline = () => setStatus('synced');
    const handleOffline = () => setStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { status, setStatus };
}

interface SyncStatusBarProps {
  status: SyncStatus;
}

const SyncStatusBar = ({ status }: SyncStatusBarProps) => {
  if (status === 'synced') return null; // Tidak tampil kalau normal

  const config = {
    syncing: {
      icon: <RefreshCw size={12} className="animate-spin" />,
      text: 'Menyinkronkan data...',
      bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    },
    offline: {
      icon: <CloudOff size={12} />,
      text: 'Offline — data tersimpan lokal',
      bg: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    },
    error: {
      icon: <CloudOff size={12} />,
      text: 'Gagal sinkronisasi — coba lagi nanti',
      bg: 'bg-red-500/10 border-red-500/20 text-red-400',
    },
  };

  const c = config[status];

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-1.5 py-1 text-xs font-medium border-b ${c.bg}`}>
      {c.icon}
      {c.text}
    </div>
  );
};

export default SyncStatusBar;

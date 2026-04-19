import { 
  Bell, 
  Search, 
  Settings, 
  HelpCircle,
  Plus
} from 'lucide-react';
import { useStore } from '../../store/useStore';

const Navbar = () => {
  const { setActiveTab, notifications } = useStore();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-20 bg-card/80 backdrop-blur-md border-b border-border fixed top-0 left-64 right-0 z-40 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Cari proyek, AHSP, atau material..."
            className="w-full h-11 bg-background border border-border rounded-xl pl-12 pr-4 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={() => setActiveTab('kalkulator')}
          className="btn-primary flex items-center gap-2 py-2"
        >
          <Plus size={18} />
          <span>Proyek Baru</span>
        </button>

        <div className="flex items-center gap-4 text-text-secondary">
          <button 
            onClick={() => setActiveTab('notifikasi')}
            className="hover:text-white transition-colors p-2 rounded-lg hover:bg-border relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-glow px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('manajemen')}
            className="hover:text-white transition-colors p-2 rounded-lg hover:bg-border"
          >
            <Settings size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('about')}
            className="hover:text-white transition-colors p-2 rounded-lg hover:bg-border"
          >
            <HelpCircle size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

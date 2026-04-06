import { 
  LayoutDashboard, 
  Calculator, 
  Database, 
  BookOpen, 
  Settings, 
  LogOut,
  UserCircle,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Sidebar = () => {
  const { activeTab, setActiveTab, userRole, logout, user } = useStore();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kalkulator', label: 'Kalkulator RAB', icon: Calculator },
    { id: 'analysis', label: 'Analisis Struktur', icon: BarChart3 },
    { id: 'ahsp', label: 'AHSP Database', icon: Database },
    { id: 'buku-harian', label: 'Buku Harian', icon: BookOpen },
    { id: 'manajemen', label: 'Manajemen Proyek', icon: Settings },
    ...(userRole === 'admin' ? [{ id: 'admin', label: 'Control Panel', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-glow">
          <span className="text-white font-bold text-xl">S</span>
        </div>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">Sivilize Hub</h1>
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">Pro Edition</p>
        </div>
      </div>

      <nav className="flex-1 px-4 mt-6">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-text-secondary hover:bg-border hover:text-white"
                )}
              >
                <Icon size={20} className={cn(
                  "transition-colors",
                  isActive ? "text-primary" : "text-text-secondary group-hover:text-white"
                )} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute right-0 w-1 h-6 bg-primary rounded-l-full shadow-glow" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-3 bg-background rounded-xl border border-border">
          <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center text-text-secondary">
            <UserCircle size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name || 'Engineer Admin'}</p>
            <p className="text-text-secondary text-xs truncate capitalize">{user?.role || userRole}</p>
          </div>
          <button 
            onClick={() => logout()}
            className="text-text-secondary hover:text-red-500 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

import { useEffect, useState } from 'react';
import { 
  Folder, Search, Filter, Plus, Clock, TrendingUp, Copy,
  Trash2, History, Eye, BarChart3, X, CheckCircle2,
  Activity, Users, DollarSign
} from 'lucide-react';
import { useStore, type Project } from '../../store/useStore';
import { formatCurrency } from '../../utils/calculations';
import { projectService } from '../../services/api';
import { getCityDisplayName } from '../../data/prices';
import { useToast } from '../common/Toast';
import KurvaS from './KurvaS';
import LaborCalculator from './LaborCalculator';
import CostRealizationTracker from './CostRealizationTracker';

const ProjectManagement = () => {
  const { projects, setProjects, setActiveTab, addProject, deleteProject } = useStore();
  const { showToast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [viewProject, setViewProject] = useState<Project | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'kurvas' | 'upah' | 'realisasi'>('info');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectService.getProjects();
        if (response.success) {
          setProjects(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch projects', error);
      }
    };

    fetchProjects();
  }, [setProjects]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus proyek ini?')) {
      try {
        await projectService.deleteProject(id);
        deleteProject(id);
        showToast('Proyek berhasil dihapus', 'success');
      } catch {
        showToast('Gagal menghapus proyek', 'error');
      }
    }
  };

  const handleDuplicate = (project: Project) => {
    const copy: Project = {
      ...project,
      id: globalThis.crypto?.randomUUID?.() ?? `copy-${project.id}`,
      name: `${project.name} (Salinan)`,
      status: 'draft',
      dailyLogs: [],
    };
    addProject(copy);
    showToast(`Proyek "${project.name}" berhasil diduplikat`, 'success');
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase()) ||
    getCityDisplayName(p.location).toLowerCase().includes(searchText.toLowerCase())
  );

  const activeProjectsCount = projects.filter(p => p.status !== 'completed').length;
  const totalBudget = projects.reduce((acc, p) => {
    const latestVersion = p.versions?.[p.versions.length - 1];
    return acc + (latestVersion?.summary?.grandTotal || 0);
  }, 0);

  // Calculate average cost per m2
  const projectsWithArea = projects.filter(p => {
    const area = p.dimensions.reduce((sum, dim) => sum + (dim.length * dim.width), 0);
    return area > 0;
  });
  
  const averageCostPerM2 = projectsWithArea.length > 0 
    ? projectsWithArea.reduce((acc, p) => {
        const area = p.dimensions.reduce((sum, dim) => sum + (dim.length * dim.width), 0);
        const latestVersion = p.versions?.[p.versions.length - 1];
        const cost = latestVersion?.summary?.grandTotal || 0;
        return acc + (cost / area);
      }, 0) / projectsWithArea.length 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white italic tracking-tight">Manajemen Proyek</h2>
          <p className="text-text-secondary mt-1">Kelola portofolio dan riwayat perhitungan RAB</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
            onClick={() => setActiveTab('kalkulator')}
            className="btn-primary flex items-center gap-2 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            <span>Proyek Baru</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center justify-between group hover:border-primary/30 transition-all">
          <div>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Proyek Aktif</p>
            <h3 className="text-2xl font-black text-white mt-2">{activeProjectsCount} Proyek</h3>
          </div>
          <div className="bg-primary/10 text-primary p-3 rounded-xl group-hover:scale-110 transition-transform shadow-glow">
            <TrendingUp size={24} />
          </div>
        </div>
        <div className="glass-card p-6 flex items-center justify-between group hover:border-success/30 transition-all">
          <div>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Total Anggaran</p>
            <h3 className="text-2xl font-black text-white mt-2">{formatCurrency(totalBudget)}</h3>
          </div>
          <div className="bg-success/10 text-success p-3 rounded-xl group-hover:scale-110 transition-transform">
            <BarChart3 size={24} />
          </div>
        </div>
        <div className="glass-card p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all">
          <div>
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Rata-rata Cost/m²</p>
            <h3 className="text-2xl font-black text-white mt-2">{formatCurrency(averageCostPerM2)}</h3>
          </div>
          <div className="bg-blue-500/10 text-blue-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
            <Folder size={24} />
          </div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="glass-card p-20 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-glow animate-pulse">
            <Folder size={48} />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-2xl font-bold text-white">Belum Ada Proyek</h3>
            <p className="text-text-secondary">Anda belum memiliki proyek apapun. Mulai dengan membuat perhitungan RAB baru untuk melihat manajemen portofolio Anda di sini.</p>
          </div>
          <button 
            onClick={() => setActiveTab('kalkulator')}
            className="btn-primary flex items-center gap-2 px-8 py-3"
          >
            <Plus size={20} />
            <span>Mulai Proyek Pertama</span>
          </button>
        </div>
      ) : (
        <div className="glass-card">
          <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Cari nama proyek atau lokasi..."
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-background border border-border text-text-secondary px-4 py-2 rounded-xl text-sm font-semibold hover:text-white transition-all flex items-center gap-2">
                <Filter size={16} />
                Filter
              </button>
              <button className="bg-background border border-border text-text-secondary px-4 py-2 rounded-xl text-sm font-semibold hover:text-white transition-all flex items-center gap-2">
                <History size={16} />
                History
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-background/50 text-text-secondary text-[10px] uppercase font-bold tracking-widest">
                  <th className="px-6 py-4">Proyek & Lokasi</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Revisi</th>
                  <th className="px-6 py-4">Total RAB</th>
                  <th className="px-6 py-4">Update Terakhir</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProjects.map((project: Project) => {
                  const latestVersion = project.versions?.[project.versions.length - 1];
                  const budget = latestVersion?.summary?.grandTotal || 0;
                  const lastUpdate = latestVersion?.timestamp 
                    ? new Date(latestVersion.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '-';

                  return (
                    <tr key={project.id} className="hover:bg-border/20 transition-all group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm">
                            <Folder size={20} />
                          </div>
                          <div>
                            <p className="text-white font-bold group-hover:text-primary transition-colors">{project.name}</p>
                            <p className="text-text-secondary text-[10px] font-bold uppercase tracking-widest mt-0.5">{getCityDisplayName(project.location)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          project.status === 'completed' ? 'bg-success/10 text-success border border-success/20' :
                          project.status === 'ongoing' ? 'bg-primary/10 text-primary border border-primary/20' :
                          'bg-text-secondary/10 text-text-secondary border border-border'
                        }`}>
                          {project.status}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-2">
                            {project.versions?.slice(0, 3).map((_v, i: number) => (
                              <div key={i} className="w-6 h-6 rounded-full bg-border border-2 border-card flex items-center justify-center text-[10px] text-text-secondary font-bold">
                                v{i+1}
                              </div>
                            ))}
                            {project.versions?.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[10px] text-primary font-bold">
                                +{project.versions.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-white font-black">
                        {formatCurrency(budget)}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-text-secondary text-xs font-medium">
                          <Clock size={14} />
                          <span>{lastUpdate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setViewProject(project)}
                            className="p-2 hover:bg-border rounded-lg text-text-secondary hover:text-white transition-all" title="Lihat">
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => handleDuplicate(project)}
                            className="p-2 hover:bg-border rounded-lg text-text-secondary hover:text-white transition-all" title="Duplikat">
                            <Copy size={18} />
                          </button>
                          <button 
                            onClick={() => handleDelete(project.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-500 transition-all" 
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Project Modal — Full Detail */}
      {viewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setViewProject(null)} />
          <div className="relative glass-card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">{viewProject.name}</h3>
                <p className="text-text-secondary text-sm">{getCityDisplayName(viewProject.location)}</p>
              </div>
              <button onClick={() => setViewProject(null)} className="text-text-secondary hover:text-white p-2"><X size={20} /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-4 shrink-0">
              {[
                { id: 'info', label: 'Info', icon: <Folder size={14} /> },
                { id: 'kurvas', label: 'Kurva S', icon: <Activity size={14} /> },
                { id: 'upah', label: 'Upah TK', icon: <Users size={14} /> },
                { id: 'realisasi', label: 'Realisasi', icon: <DollarSign size={14} /> },
              ].map(tab => (
                <button key={tab.id} onClick={() => setDetailTab(tab.id as typeof detailTab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    detailTab === tab.id ? 'bg-primary text-white' : 'text-text-secondary hover:text-white'
                  }`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === 'info' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      { label: 'Status', value: viewProject.status },
                      { label: 'Lantai', value: viewProject.floors },
                      { label: 'Versi RAB', value: `${viewProject.versions?.length || 0} versi` },
                      { label: 'Kamar Tidur', value: viewProject.bedroomCount ?? '-' },
                      { label: 'Kamar Mandi', value: viewProject.bathroomCount ?? '-' },
                      { label: 'Jenis Tanah', value: viewProject.soilType ?? '-' },
                      { label: 'Pondasi', value: viewProject.foundationType ?? '-' },
                      { label: 'Tipe Lokasi', value: viewProject.locationType ?? '-' },
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-text-secondary text-xs uppercase font-bold tracking-widest">{item.label}</p>
                        <p className="text-white capitalize">{String(item.value)}</p>
                      </div>
                    ))}
                  </div>
                  {viewProject.versions?.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <p className="text-text-secondary text-xs uppercase font-bold tracking-widest mb-2">Total RAB</p>
                      <p className="text-3xl font-black text-primary">
                        {formatCurrency(viewProject.versions[viewProject.versions.length - 1]?.summary?.grandTotal || 0)}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { handleDuplicate(viewProject); setViewProject(null); }} className="btn-secondary flex-1 flex items-center justify-center gap-2">
                      <Copy size={16} /> Duplikat
                    </button>
                    <button onClick={() => setViewProject(null)} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      <CheckCircle2 size={16} /> Tutup
                    </button>
                  </div>
                </div>
              )}
              {detailTab === 'kurvas' && <KurvaS project={viewProject} />}
              {detailTab === 'upah' && <LaborCalculator projectId={viewProject.id} />}
              {detailTab === 'realisasi' && <CostRealizationTracker projectId={viewProject.id} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;

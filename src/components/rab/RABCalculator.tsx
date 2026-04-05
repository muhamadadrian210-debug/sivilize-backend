import { Fragment, useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Calculator as CalcIcon,
  Building2,
  MapPin,
  Layers,
  CheckCircle2,
  Info,
  AlertTriangle,
  FileText,
  FileDown,
  Sparkles,
  Upload,
  AlertCircle,
  Users
} from 'lucide-react';
import { useStore, type RABItem, type Project } from '../../store/useStore';
import { AHSP_TEMPLATES } from '../../data/ahsp';
import {
  PROVINCES,
  DEFAULT_CITY_ID,
  DEFAULT_PROVINCE_ID,
  DEFAULT_MATERIAL_GRADE,
  MATERIAL_GRADE_OPTIONS,
  getCitiesByProvince,
  type MaterialGrade,
} from '../../data/prices';
import { projectService } from '../../services/api';
import { 
  calculateVolumeFromDimensions, 
  calculateAHSPItem, 
  calculateTotalRAB, 
  formatCurrency, 
  getCostCategory 
} from '../../utils/calculations';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import MaterialSummary from './MaterialSummary';
import ProjectTimeline from './ProjectTimeline';
import GroupedRABDisplay from './GroupedRABDisplay';
import { motion, AnimatePresence } from 'framer-motion';

const RABCalculator = () => {
  const { addProject, setActiveTab } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'rab' | 'materials' | 'timeline'>('rab');
  const [selectedProvince, setSelectedProvince] = useState(DEFAULT_PROVINCE_ID);
  const [materialGrade, setMaterialGrade] = useState<MaterialGrade>(DEFAULT_MATERIAL_GRADE);

  // Form State
  const [projectData, setProjectData] = useState<Partial<Project>>({
    name: '',
    location: DEFAULT_CITY_ID,
    materialGrade: DEFAULT_MATERIAL_GRADE,
    type: 'rumah',
    roofModel: '2-air',
    floors: 1,
    dimensions: [{ length: 0, width: 0, height: 3 }],
    status: 'draft',
    bedroomCount: 3,
    bathroomCount: 2,
    doorCount: 4,
    windowCount: 6,
  });

  const [rabItems, setRabItems] = useState<RABItem[]>([]);
  const [selectedItemForTeam, setSelectedItemForTeam] = useState<string | null>(null);
  const [financials, setFinancials] = useState({
    overhead: 5,
    profit: 10,
    tax: 11,
    contingency: 0,
  });

  const cityOptions = useMemo(() => getCitiesByProvince(selectedProvince), [selectedProvince]);

  const handleSaveProject = async () => {
    setSaving(true);
    try {
      const versionId = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
      const timestamp = Date.now();
      const payload = {
        ...projectData,
        materialGrade,
        versions: [{
          id: versionId,
          versionNum: 1,
          timestamp,
          rabItems,
          financialSettings: financials,
          summary: summary
        }]
      };
      
      const response = await projectService.createProject(payload);
      if (response.success) {
        addProject(response.data);
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Failed to save project', error);
      alert('Gagal menyimpan proyek');
    } finally {
      setSaving(false);
    }
  };

  // Calculations
  const { totalArea, totalVolume } = useMemo(() => 
    calculateVolumeFromDimensions(projectData.type!, projectData.floors!, projectData.dimensions!),
    [projectData]
  );

  const summary = useMemo(() => 
    calculateTotalRAB(rabItems, financials),
    [rabItems, financials]
  );

  const costPerM2 = totalArea > 0 ? summary.grandTotal / totalArea : 0;
  const category = getCostCategory(costPerM2);

  // Auto-generate basic items based on dimensions
  const handleGenerateRAB = () => {
    setLoading(true);
    setTimeout(() => {
      const generated: RABItem[] = [];
      
      // Estimasi volume dasar rumah tinggal minimalis
      const concreteVol = totalArea * 0.15; // Rough estimate for foundation/beams
      const excavationVol = totalArea * 0.2;
      const steelWeight = totalArea * 18;
      const wallArea = (Math.sqrt(totalArea) * 4) * 3 * projectData.floors!;
      const plasterArea = wallArea * 2;
      const paintArea = plasterArea;
      const roofAreaFactorMap: Record<NonNullable<Project['roofModel']>, number> = {
        '1-air': 1.1,
        '2-air': 1.2,
        '3-air': 1.3,
        '4-air': 1.35,
        dak: 1.0,
      };
      const roofArea = totalArea * (roofAreaFactorMap[projectData.roofModel || '2-air']);
      
      const templates = AHSP_TEMPLATES;
      const addItem = (templateId: string, volume: number, team: Record<string, number>) => {
        const template = templates.find((t) => t.id === templateId);
        if (!template) return;
        const unitPrice = calculateAHSPItem(template, projectData.location!, materialGrade);
        generated.push({
          id: `${generated.length + 1}`,
          category: template.category,
          name: template.name,
          unit: template.unit,
          volume,
          unitPrice,
          total: volume * unitPrice,
          assignedTeam: team,
        });
      };
      
      // Pondasi - Struktur
      addItem('str-001', excavationVol, { 'Pekerja': 3, 'Mandor': 1 });
      addItem('str-002', concreteVol, { 'Pekerja': 4, 'Tukang Batu': 2, 'Kepala Tukang': 1, 'Mandor': 1 });
      addItem('str-003', steelWeight, { 'Pekerja': 2, 'Tukang Besi': 2, 'Mandor': 1 });

      // Arsitektur
      addItem('ars-001', wallArea, { 'Pekerja': 3, 'Tukang Batu': 2, 'Mandor': 1 });
      addItem('ars-002', plasterArea, { 'Pekerja': 3, 'Tukang Batu': 2, 'Mandor': 1 });
      addItem('ars-003', roofArea, { 'Pekerja': 2, 'Tukang Besi': 2, 'Mandor': 1 });
      addItem(projectData.roofModel === 'dak' ? 'str-002' : 'ars-004', roofArea, { 'Pekerja': 2, 'Tukang Batu': 2, 'Mandor': 1 });
      if (projectData.roofModel !== 'dak') {
        addItem('ars-005', roofArea * 0.6, { 'Pekerja': 2, 'Tukang Besi': 1, 'Mandor': 1 });
      }

      // Finishing
      addItem('fin-001', paintArea, { 'Pekerja': 2, 'Tukang Cat': 2, 'Mandor': 1 });

      // Bukaan - Pintu & Jendela
      const doorCount = projectData.doorCount ?? 4;
      const windowCount = projectData.windowCount ?? 6;
      const bathroomCount = projectData.bathroomCount ?? 2;

      // Pintu utama + kamar tidur (kurangi pintu kamar mandi)
      const mainDoors = Math.max(0, doorCount - bathroomCount);
      if (mainDoors > 0) {
        addItem('buk-001', mainDoors, { 'Pekerja': 1, 'Tukang Kayu': 2, 'Mandor': 1 });
      }
      // Pintu kamar mandi
      if (bathroomCount > 0) {
        addItem('buk-003', bathroomCount, { 'Pekerja': 1, 'Tukang Kayu': 1, 'Mandor': 1 });
      }
      // Jendela
      if (windowCount > 0) {
        addItem('buk-002', windowCount, { 'Pekerja': 1, 'Tukang Kayu': 2, 'Mandor': 1 });
      }

      setRabItems(generated);
      setLoading(false);
      setStep(3);
    }, 1500);
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">Data Dasar Proyek</h3>
              <button 
                onClick={() => setAiMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-primary/20 transition-all group"
              >
                <Sparkles size={16} className="group-hover:animate-pulse" />
                <span>AI Mode (Upload Denah)</span>
              </button>
            </div>
            
            {/* AI Modal Simulation */}
            {aiMode && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setAiMode(false)} />
                <div className="relative glass-card w-full max-w-lg p-8 space-y-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <Sparkles className="text-primary" />
                    AI Vision Analysis
                  </h3>
                  <div className="border-2 border-dashed border-border rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/50 transition-colors cursor-pointer group">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Upload size={32} />
                    </div>
                    <p className="text-text-secondary text-sm text-center">Tarik gambar denah ke sini atau klik untuk memilih file</p>
                  </div>
                  
                  {aiProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-text-secondary">
                        <span>Menganalisa Dimensi...</span>
                        <span>{aiProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-primary shadow-glow transition-all duration-300" style={{ width: `${aiProgress}%` }} />
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      let p = 0;
                      const interval = setInterval(() => {
                        p += 10;
                        setAiProgress(p);
                        if (p >= 100) {
                          clearInterval(interval);
                          setProjectData({
                            ...projectData,
                            name: 'Proyek dari AI Vision',
                            dimensions: [{ length: 12, width: 8, height: 3 }]
                          });
                          setTimeout(() => {
                            setAiMode(false);
                            setAiProgress(0);
                            setStep(2);
                          }, 500);
                        }
                      }, 200);
                    }}
                    className="btn-primary w-full"
                  >
                    Mulai Analisa AI
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-text-secondary text-sm font-medium">Nama Proyek</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <input 
                    type="text" 
                    value={projectData.name}
                    onChange={(e) => setProjectData({...projectData, name: e.target.value})}
                    placeholder="Contoh: Rumah Tinggal Modern"
                    className="w-full h-12 bg-background border border-border rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-text-secondary text-sm font-medium">Provinsi</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <select 
                    value={selectedProvince}
                    onChange={(e) => {
                      const provinceId = e.target.value;
                      const firstCity = getCitiesByProvince(provinceId)[0];
                      setSelectedProvince(provinceId);
                      setProjectData({ ...projectData, location: firstCity?.id || '' });
                    }}
                    className="w-full h-12 bg-background border border-border rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-primary appearance-none transition-all"
                  >
                    {PROVINCES.map((province) => (
                      <option key={province.id} value={province.id}>{province.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-text-secondary text-sm font-medium">Kota/Kabupaten</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                  <select
                    value={projectData.location}
                    onChange={(e) => setProjectData({ ...projectData, location: e.target.value })}
                    className="w-full h-12 bg-background border border-border rounded-xl pl-12 pr-4 text-white focus:outline-none focus:border-primary appearance-none transition-all"
                  >
                    {cityOptions.map((city) => (
                      <option key={city.id} value={city.id}>{city.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-text-secondary text-sm font-medium">Tipe Bangunan</label>
                <input
                  value="Rumah Minimalis"
                  disabled
                  className="w-full h-12 bg-background/60 border border-border rounded-xl px-4 text-white outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-text-secondary text-sm font-medium">Jumlah Lantai</label>
                <input 
                  type="number" 
                  min="1"
                  value={projectData.floors}
                  onChange={(e) => {
                    const floors = parseInt(e.target.value) || 1;
                    const dims = Array(floors).fill(0).map((_, i) => projectData.dimensions![i] || { length: 0, width: 0, height: 3 });
                    setProjectData({...projectData, floors, dimensions: dims});
                  }}
                  className="w-full h-12 bg-background border border-border rounded-xl px-4 text-white focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-text-secondary text-sm font-medium">Grade Material</label>
                <select
                  value={materialGrade}
                  onChange={(e) => {
                    const grade = e.target.value as MaterialGrade;
                    setMaterialGrade(grade);
                    setProjectData({ ...projectData, materialGrade: grade });
                  }}
                  className="w-full h-12 bg-background border border-border rounded-xl px-4 text-white focus:outline-none focus:border-primary appearance-none transition-all"
                >
                  {MATERIAL_GRADE_OPTIONS.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-text-secondary">
                  Transparansi merek material tampil di tab Kebutuhan Material.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-text-secondary text-sm font-medium">Model Atap</label>
                <select
                  value={projectData.roofModel}
                  onChange={(e) => setProjectData({ ...projectData, roofModel: e.target.value as Project['roofModel'] })}
                  className="w-full h-12 bg-background border border-border rounded-xl px-4 text-white focus:outline-none focus:border-primary appearance-none transition-all"
                >
                  <option value="1-air">Atap 1 Air</option>
                  <option value="2-air">Atap 2 Air</option>
                  <option value="3-air">Atap 3 Air</option>
                  <option value="4-air">Atap 4 Air</option>
                  <option value="dak">Atap Dak Beton</option>
                </select>
              </div>
            </div>

            {/* Detail Ruangan & Bukaan */}
            <div className="border-t border-border pt-6">
              <h4 className="text-sm font-bold text-text-secondary uppercase tracking-widest mb-4">Detail Ruangan &amp; Bukaan</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-text-secondary text-sm font-medium">Kamar Tidur</label>
                  <input
                    type="number" min="0"
                    value={projectData.bedroomCount}
                    onChange={(e) => setProjectData({...projectData, bedroomCount: parseInt(e.target.value) || 0})}
                    className="w-full h-12 bg-background border border-border rounded-xl px-4 text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-text-secondary text-sm font-medium">Kamar Mandi</label>
                  <input
                    type="number" min="0"
                    value={projectData.bathroomCount}
                    onChange={(e) => setProjectData({...projectData, bathroomCount: parseInt(e.target.value) || 0})}
                    className="w-full h-12 bg-background border border-border rounded-xl px-4 text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-text-secondary text-sm font-medium">Jumlah Pintu</label>
                  <input
                    type="number" min="0"
                    value={projectData.doorCount}
                    onChange={(e) => setProjectData({...projectData, doorCount: parseInt(e.target.value) || 0})}
                    className="w-full h-12 bg-background border border-border rounded-xl px-4 text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-text-secondary text-sm font-medium">Jumlah Jendela</label>
                  <input
                    type="number" min="0"
                    value={projectData.windowCount}
                    onChange={(e) => setProjectData({...projectData, windowCount: parseInt(e.target.value) || 0})}
                    className="w-full h-12 bg-background border border-border rounded-xl px-4 text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={20} className="text-primary" />
              Dimensi Per Lantai
            </h3>
            <div className="space-y-4">
              {projectData.dimensions?.map((dim, index) => (
                <div key={index} className="bg-background/50 border border-border p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary uppercase font-bold tracking-wider">Panjang (m)</label>
                    <input 
                      type="number" 
                      value={dim.length}
                      onChange={(e) => {
                        const newDims = [...projectData.dimensions!];
                        newDims[index].length = parseFloat(e.target.value) || 0;
                        setProjectData({...projectData, dimensions: newDims});
                      }}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary uppercase font-bold tracking-wider">Lebar (m)</label>
                    <input 
                      type="number" 
                      value={dim.width}
                      onChange={(e) => {
                        const newDims = [...projectData.dimensions!];
                        newDims[index].width = parseFloat(e.target.value) || 0;
                        setProjectData({...projectData, dimensions: newDims});
                      }}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-text-secondary uppercase font-bold tracking-wider">Tinggi (m)</label>
                    <input 
                      type="number" 
                      value={dim.height}
                      onChange={(e) => {
                        const newDims = [...projectData.dimensions!];
                        newDims[index].height = parseFloat(e.target.value) || 0;
                        setProjectData({...projectData, dimensions: newDims});
                      }}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">Hasil Kalkulasi Dimensi</p>
                <div className="flex items-center gap-8 mt-2">
                  <div>
                    <span className="text-white font-bold text-2xl">{totalArea.toFixed(2)}</span>
                    <span className="text-text-secondary ml-1">m² Luas Total</span>
                  </div>
                  <div>
                    <span className="text-white font-bold text-2xl">{totalVolume.toFixed(2)}</span>
                    <span className="text-text-secondary ml-1">m³ Volume Total</span>
                  </div>
                </div>
              </div>
              <Info className="text-primary opacity-50" size={32} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 bg-background border border-border p-1 rounded-xl">
                <button 
                  onClick={() => setActiveSubTab('rab')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'rab' ? 'bg-primary text-white shadow-glow' : 'text-text-secondary hover:text-white'}`}
                >
                  Breakdown RAB
                </button>
                <button 
                  onClick={() => setActiveSubTab('materials')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'materials' ? 'bg-primary text-white shadow-glow' : 'text-text-secondary hover:text-white'}`}
                >
                  Kebutuhan Material
                </button>
                <button 
                  onClick={() => setActiveSubTab('timeline')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'timeline' ? 'bg-primary text-white shadow-glow' : 'text-text-secondary hover:text-white'}`}
                >
                  Timeline & Jadwal
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => exportToPDF(projectData, rabItems, financials, materialGrade)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold hover:bg-red-500/20 transition-all"
                >
                  <FileDown size={16} />
                  <span>PDF</span>
                </button>
                <button 
                  onClick={() => exportToExcel(projectData, rabItems, financials, materialGrade)}
                  className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success border border-success/20 rounded-xl text-sm font-bold hover:bg-success/20 transition-all"
                >
                  <FileText size={16} />
                  <span>Excel</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {activeSubTab === 'rab' && (
                <motion.div 
                  key="rab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <GroupedRABDisplay 
                    items={rabItems}
                    onUpdateItem={(index, updates) => {
                      const newItems = [...rabItems];
                      newItems[index] = { ...newItems[index], ...updates };
                      setRabItems(newItems);
                    }}
                    onDeleteItem={(index) => {
                      const newItems = rabItems.filter((_, i) => i !== index);
                      setRabItems(newItems);
                    }}
                    onAddItem={() => {
                      const newItem: RABItem = {
                        id: `item-${Date.now()}`,
                        category: 'Lain-lain',
                        name: 'Item Baru',
                        volume: 0,
                        unit: 'm2',
                        unitPrice: 0,
                        total: 0,
                        assignedTeam: {}
                      };
                      setRabItems([...rabItems, newItem]);
                    }}
                    onSelectTeam={(itemId) => setSelectedItemForTeam(itemId)}
                  />

                  {/* Manual Labor Modal */}
                  {selectedItemForTeam && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setSelectedItemForTeam(null)} />
                      <div className="relative glass-card w-full max-w-md p-8 space-y-6 border-primary/30 shadow-glow-primary/20">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white flex items-center gap-3 italic">
                            <Users className="text-primary" />
                            Alokasi Tim Kerja
                          </h3>
                          <button onClick={() => setSelectedItemForTeam(null)} className="text-text-secondary hover:text-white">
                            <Trash2 size={20} />
                          </button>
                        </div>

                        <p className="text-text-secondary text-sm">
                          Tentukan jumlah tenaga kerja yang akan dibawa untuk pekerjaan: <br/>
                          <span className="text-white font-bold">{rabItems.find(i => i.id === selectedItemForTeam)?.name}</span>
                        </p>

                        <div className="space-y-4">
                          {['Pekerja', 'Tukang', 'Kepala Tukang', 'Mandor', 'Ahli Struktur'].map((role) => (
                            <div key={role} className="flex items-center justify-between bg-background/50 p-4 rounded-xl border border-border">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                  <Users size={16} />
                                </div>
                                <span className="text-white font-semibold text-sm">{role}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <button 
                                  onClick={() => {
                                    const newItems = [...rabItems];
                                    const idx = newItems.findIndex(i => i.id === selectedItemForTeam);
                                    const team = { ...(newItems[idx].assignedTeam || {}) };
                                    team[role] = Math.max(0, (team[role] || 0) - 1);
                                    newItems[idx].assignedTeam = team;
                                    setRabItems(newItems);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-border hover:bg-primary/20 text-white flex items-center justify-center transition-all"
                                >-</button>
                                <span className="text-white font-bold w-6 text-center">
                                  {rabItems.find(i => i.id === selectedItemForTeam)?.assignedTeam?.[role] || 0}
                                </span>
                                <button 
                                  onClick={() => {
                                    const newItems = [...rabItems];
                                    const idx = newItems.findIndex(i => i.id === selectedItemForTeam);
                                    const team = { ...(newItems[idx].assignedTeam || {}) };
                                    team[role] = (team[role] || 0) + 1;
                                    newItems[idx].assignedTeam = team;
                                    setRabItems(newItems);
                                  }}
                                  className="w-8 h-8 rounded-lg bg-border hover:bg-primary/20 text-white flex items-center justify-center transition-all"
                                >+</button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-4 border-t border-border">
                          <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl mb-6">
                            <Info size={18} className="text-primary flex-shrink-0" />
                            <p className="text-[10px] text-text-secondary leading-relaxed italic">
                              Perubahan jumlah tenaga kerja akan mempengaruhi estimasi durasi proyek dan distribusi biaya harian secara otomatis.
                            </p>
                          </div>
                          <button 
                            onClick={() => setSelectedItemForTeam(null)}
                            className="w-full btn-primary py-4 font-bold uppercase tracking-widest"
                          >
                            Simpan Alokasi Tim
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-card p-6 space-y-4">
                      <h4 className="font-bold text-white flex items-center gap-2 border-b border-border pb-3">
                        <CalcIcon size={18} className="text-primary" />
                        Manajemen Keuangan
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs text-text-secondary font-medium">Overhead (%)</label>
                          <input 
                            type="number" 
                            value={financials.overhead}
                            onChange={(e) => setFinancials({...financials, overhead: parseFloat(e.target.value) || 0})}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-text-secondary font-medium">Profit (%)</label>
                          <input 
                            type="number" 
                            value={financials.profit}
                            onChange={(e) => setFinancials({...financials, profit: parseFloat(e.target.value) || 0})}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-text-secondary font-medium">PPN (%)</label>
                          <input 
                            type="number" 
                            value={financials.tax}
                            onChange={(e) => setFinancials({...financials, tax: parseFloat(e.target.value) || 0})}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-text-secondary font-medium">Contingency (%)</label>
                          <input 
                            type="number" 
                            value={financials.contingency}
                            onChange={(e) => setFinancials({...financials, contingency: parseFloat(e.target.value) || 0})}
                            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white focus:border-primary outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 bg-primary/5 border-primary/20 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white mb-4">Ringkasan Biaya Akhir</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Subtotal Pekerjaan</span>
                            <span className="text-white">{formatCurrency(summary.subtotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Overhead & Profit</span>
                            <span className="text-white">{formatCurrency(summary.overheadAmount + summary.profitAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">PPN ({financials.tax}%)</span>
                            <span className="text-white">{formatCurrency(summary.taxAmount)}</span>
                          </div>
                          <div className="pt-3 border-t border-border flex justify-between">
                            <span className="text-white font-bold">TOTAL ANGGARAN</span>
                            <span className="text-primary font-black text-xl">{formatCurrency(summary.grandTotal)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex flex-col gap-4">
                  <div className="flex items-center gap-4 bg-background p-3 rounded-xl border border-border">
                    <div className={`p-2 rounded-lg ${category.color.replace('text', 'bg')}/10`}>
                      <AlertTriangle size={20} className={category.color} />
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary uppercase font-bold tracking-widest">Kategori Biaya</p>
                      <p className={`font-bold ${category.color}`}>{category.label} • {formatCurrency(costPerM2)}/m²</p>
                    </div>
                  </div>

                  {(costPerM2 > 12000000 || (costPerM2 < 2000000 && costPerM2 > 0)) && (
                    <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                      <p className="text-[10px] text-red-500 font-bold leading-tight">
                        DATA TIDAK WAJAR: Biaya per m² di luar rentang standar (Rp 3jt - 10jt). Periksa kembali volume atau harga satuan.
                      </p>
                    </div>
                  )}
                </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeSubTab === 'materials' && (
                <motion.div 
                  key="materials"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <MaterialSummary items={rabItems} cityId={projectData.location || ''} grade={materialGrade} />
                </motion.div>
              )}
              {activeSubTab === 'timeline' && (
                <motion.div 
                  key="timeline"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <ProjectTimeline items={rabItems} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((i) => (
          <Fragment key={i}>
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                step >= i ? 'bg-primary text-white shadow-glow' : 'bg-card text-text-secondary border border-border'
              }`}>
                {step > i ? <CheckCircle2 size={20} /> : i}
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${step >= i ? 'text-primary' : 'text-text-secondary'}`}>
                {i === 1 ? 'Data Proyek' : i === 2 ? 'Dimensi' : 'Breakdown RAB'}
              </span>
            </div>
            {i < 3 && <div className={`flex-1 h-0.5 mx-4 ${step > i ? 'bg-primary' : 'bg-border'}`} />}
          </Fragment>
        ))}
      </div>

      <div className="glass-card p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 pt-8 border-t border-border flex items-center justify-between">
          <button 
            onClick={prevStep}
            disabled={step === 1 || loading}
            className="btn-secondary flex items-center gap-2 disabled:opacity-0"
          >
            <ChevronLeft size={20} />
            <span>Kembali</span>
          </button>

          {step < 3 ? (
            <button 
              onClick={step === 2 ? handleGenerateRAB : nextStep}
              className="btn-primary flex items-center gap-2 min-w-[160px] justify-center"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{step === 2 ? 'Hasilkan RAB' : 'Lanjut'}</span>
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          ) : (
            <button 
              onClick={handleSaveProject}
              disabled={saving}
              className="btn-primary flex items-center gap-2 px-8"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  <span>Simpan Proyek</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RABCalculator;

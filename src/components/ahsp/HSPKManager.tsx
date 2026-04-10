import { useState, useRef } from 'react';
import {
  Upload, Download,
  Edit, Save, X, Info, MapPin, Calendar
} from 'lucide-react';
import {
  CITIES, PROVINCES, getCitiesByProvince,
  getMaterialPricesByGrade, getRegionalPriceOverride,
  mergeRegionalPriceOverride, clearRegionalPriceOverrides,
  type RegionalPriceOverride
} from '../../data/prices';
import { importRegionalPriceCsv } from '../../services/regionalPriceDataset';
import { formatCurrency } from '../../utils/calculations';
import { useToast } from '../common/Toast';

// Material & labor keys yang wajib ada sesuai PUPR
const REQUIRED_MATERIALS = [
  'Semen PC', 'Pasir Pasang', 'Pasir Beton', 'Krikil (Split)',
  'Bata Merah', 'Besi Beton', 'Kawat Beton',
  'Batu Kali', 'Pasir Urug', 'Kayu Bekisting', 'Paku',
  'Genteng Beton', 'Spandek/Galvalum', 'Baja Ringan C75',
  'Cat Penutup', 'Cat Dasar', 'Plamir',
  'Pipa PVC 1/2"', 'Pipa PVC 3"', 'Kloset Duduk',
  'Kabel NYM 2x1.5mm', 'MCB 1 Phase',
];

const REQUIRED_LABOR = [
  'Pekerja', 'Tukang Batu', 'Tukang Besi', 'Tukang Kayu',
  'Tukang Cat', 'Tukang Pipa', 'Tukang Listrik',
  'Kepala Tukang', 'Mandor',
];

const HSPK_LAST_UPDATE_KEY = 'sivilize_hspk_last_update';

const HSPKManager = () => {
  const { showToast } = useToast();
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]?.id ?? '');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [editType, setEditType] = useState<'material' | 'labor'>('material');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const lastUpdate = localStorage.getItem(HSPK_LAST_UPDATE_KEY);
  const cities = getCitiesByProvince(selectedProvince);
  const selectedCity = CITIES.find(c => c.id === selectedCityId);
  const override = selectedCityId ? getRegionalPriceOverride(selectedCityId) : undefined;
  const defaultPrices = selectedCityId ? getMaterialPricesByGrade(selectedCityId, 'B') : {};

  const startEdit = (type: 'material' | 'labor') => {
    setEditType(type);
    const keys = type === 'material' ? REQUIRED_MATERIALS : REQUIRED_LABOR;
    const current: Record<string, number> = {};
    keys.forEach(k => {
      if (type === 'material') {
        current[k] = override?.materials?.[k] ?? defaultPrices[k] ?? 0;
      } else {
        current[k] = override?.labor?.[k] ?? selectedCity?.labor[k] ?? 0;
      }
    });
    setEditValues(current);
    setEditMode(true);
  };

  const saveEdit = () => {
    if (!selectedCityId) return;
    const patch: RegionalPriceOverride = editType === 'material'
      ? { materials: editValues }
      : { labor: editValues };
    mergeRegionalPriceOverride(selectedCityId, patch);
    localStorage.setItem(HSPK_LAST_UPDATE_KEY, new Date().toLocaleDateString('id-ID'));
    setEditMode(false);
    showToast(`HSPK ${selectedCity?.name} berhasil disimpan`, 'success');
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await importRegionalPriceCsv(file);
      localStorage.setItem(HSPK_LAST_UPDATE_KEY, new Date().toLocaleDateString('id-ID'));
      showToast(`Import berhasil: ${result.rows} baris, ${result.updatedCities} kota diupdate`, 'success');
    } catch {
      showToast('Gagal import CSV', 'error');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (!confirm('Reset semua harga HSPK ke default? Data override akan hilang.')) return;
    clearRegionalPriceOverrides();
    localStorage.removeItem(HSPK_LAST_UPDATE_KEY);
    showToast('HSPK direset ke harga default', 'info');
  };

  const downloadTemplate = () => {
    const rows = [
      'cityId,type,name,price',
      ...REQUIRED_MATERIALS.map(m => `${selectedCityId || 'jateng-1'},material,${m},0`),
      ...REQUIRED_LABOR.map(l => `${selectedCityId || 'jateng-1'},labor,${l},0`),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_hspk_${selectedCityId || 'kota'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-white font-bold text-lg">Manajemen HSPK Regional</h3>
          <p className="text-text-secondary text-xs mt-1">
            Harga Satuan Pokok Kegiatan — sesuaikan dengan HSPK resmi Pemda setempat
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <div className="flex items-center gap-1.5 text-xs text-text-secondary bg-background border border-border px-3 py-1.5 rounded-lg">
              <Calendar size={12} />
              <span>Update: {lastUpdate}</span>
            </div>
          )}
          <button onClick={downloadTemplate} className="btn-secondary flex items-center gap-2 text-sm py-2">
            <Download size={14} /> Template CSV
          </button>
          <label className="btn-secondary flex items-center gap-2 text-sm py-2 cursor-pointer">
            <Upload size={14} />
            {importing ? 'Mengimpor...' : 'Import CSV'}
            <input ref={fileRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          </label>
          <button onClick={handleReset} className="text-xs text-red-400 border border-red-500/20 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors">
            Reset Default
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-300 space-y-1">
          <p className="font-bold">Cara penggunaan HSPK:</p>
          <p>1. Pilih provinsi dan kota → Edit harga material/upah sesuai HSPK Pemda setempat</p>
          <p>2. Atau download template CSV → isi harga → import kembali (untuk update massal)</p>
          <p>3. Harga yang diinput akan otomatis dipakai saat menghitung RAB untuk kota tersebut</p>
          <p className="text-blue-400">Referensi: HSPK Kota/Kabupaten tahun berjalan dari Dinas PU setempat</p>
        </div>
      </div>

      {/* City Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-text-secondary uppercase font-bold tracking-widest">Provinsi</label>
          <select value={selectedProvince}
            onChange={e => { setSelectedProvince(e.target.value); setSelectedCityId(''); setEditMode(false); }}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none appearance-none">
            {PROVINCES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-text-secondary uppercase font-bold tracking-widest">Kota/Kabupaten</label>
          <select value={selectedCityId}
            onChange={e => { setSelectedCityId(e.target.value); setEditMode(false); }}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:border-primary outline-none appearance-none">
            <option value="">-- Pilih Kota --</option>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Price Table */}
      {selectedCityId && !editMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span className="text-white font-bold">{selectedCity?.name}, {selectedCity?.provinceName}</span>
              {override && (
                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded text-[10px] font-bold uppercase">
                  HSPK Custom
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit('material')} className="btn-secondary text-sm py-2 flex items-center gap-2">
                <Edit size={14} /> Edit Material
              </button>
              <button onClick={() => startEdit('labor')} className="btn-secondary text-sm py-2 flex items-center gap-2">
                <Edit size={14} /> Edit Upah
              </button>
            </div>
          </div>

          {/* Material Prices */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3 bg-background/50 border-b border-border">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Harga Material (per satuan)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background/30 text-text-secondary text-[10px] uppercase tracking-widest">
                    <th className="px-4 py-2">Material</th>
                    <th className="px-4 py-2">Harga Default</th>
                    <th className="px-4 py-2">Harga HSPK</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {REQUIRED_MATERIALS.map(mat => {
                    const def = defaultPrices[mat] ?? 0;
                    const custom = override?.materials?.[mat];
                    const diff = custom ? ((custom - def) / def * 100) : 0;
                    return (
                      <tr key={mat} className="hover:bg-border/10">
                        <td className="px-4 py-2.5 text-white text-sm">{mat}</td>
                        <td className="px-4 py-2.5 text-text-secondary text-sm font-mono">{formatCurrency(def)}</td>
                        <td className="px-4 py-2.5 text-sm font-mono font-bold">
                          {custom ? (
                            <span className="text-primary">{formatCurrency(custom)}</span>
                          ) : (
                            <span className="text-text-secondary italic">Pakai default</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {custom ? (
                            <span className={`text-[10px] font-bold ${diff > 20 ? 'text-red-400' : diff < -10 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-text-secondary text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Labor Prices */}
          <div className="glass-card overflow-hidden">
            <div className="px-5 py-3 bg-background/50 border-b border-border">
              <p className="text-text-secondary text-xs font-bold uppercase tracking-widest">Upah Tenaga Kerja (per OH)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-background/30 text-text-secondary text-[10px] uppercase tracking-widest">
                    <th className="px-4 py-2">Jabatan</th>
                    <th className="px-4 py-2">Upah Default</th>
                    <th className="px-4 py-2">Upah HSPK</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {REQUIRED_LABOR.map(lab => {
                    const def = selectedCity?.labor[lab] ?? 0;
                    const custom = override?.labor?.[lab];
                    const diff = custom ? ((custom - def) / def * 100) : 0;
                    return (
                      <tr key={lab} className="hover:bg-border/10">
                        <td className="px-4 py-2.5 text-white text-sm">{lab}</td>
                        <td className="px-4 py-2.5 text-text-secondary text-sm font-mono">{formatCurrency(def)}/OH</td>
                        <td className="px-4 py-2.5 text-sm font-mono font-bold">
                          {custom ? (
                            <span className="text-primary">{formatCurrency(custom)}/OH</span>
                          ) : (
                            <span className="text-text-secondary italic">Pakai default</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {custom ? (
                            <span className={`text-[10px] font-bold ${diff > 20 ? 'text-red-400' : diff < -10 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-text-secondary text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {selectedCityId && editMode && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold">
              Edit {editType === 'material' ? 'Harga Material' : 'Upah Tenaga Kerja'} — {selectedCity?.name}
            </h4>
            <button onClick={() => setEditMode(false)} className="text-text-secondary hover:text-white">
              <X size={20} />
            </button>
          </div>
          <p className="text-text-secondary text-xs">
            Masukkan harga sesuai HSPK {selectedCity?.provinceName} tahun berjalan. Kosongkan (0) untuk pakai harga default.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
            {Object.entries(editValues).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <label className="text-xs text-text-secondary font-medium">{key}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={val || ''}
                    onChange={e => setEditValues(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    placeholder={`Default: ${(editType === 'material' ? defaultPrices[key] : selectedCity?.labor[key] ?? 0).toLocaleString('id-ID')}`}
                    className="w-full bg-background border border-border rounded-lg pl-8 pr-4 py-2.5 text-white text-sm focus:border-primary outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditMode(false)} className="btn-secondary flex-1">Batal</button>
            <button onClick={saveEdit} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Save size={16} /> Simpan HSPK
            </button>
          </div>
        </div>
      )}

      {!selectedCityId && (
        <div className="glass-card p-12 text-center text-text-secondary">
          <MapPin size={32} className="mx-auto mb-3 opacity-30" />
          <p>Pilih provinsi dan kota untuk melihat atau mengedit HSPK</p>
        </div>
      )}
    </div>
  );
};

export default HSPKManager;

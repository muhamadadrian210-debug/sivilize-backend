import { useState } from 'react';
import { BookTemplate, Plus, Trash2, Download, Clock, Tag } from 'lucide-react';
import { useStore, type RABTemplate, type RABItem, type FinancialSettings } from '../../store/useStore';
import { formatCurrency } from '../../utils/calculations';
import { useToast } from '../common/Toast';

interface RABTemplateManagerProps {
  onLoadTemplate?: (items: RABItem[], financials: FinancialSettings) => void;
  currentItems?: RABItem[];
  currentFinancials?: FinancialSettings;
}

const RABTemplateManager = ({ onLoadTemplate, currentItems, currentFinancials }: RABTemplateManagerProps) => {
  const { rabTemplates, saveRABTemplate, deleteRABTemplate } = useStore();
  const { showToast } = useToast();
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCategory, setTemplateCategory] = useState('Rumah Tinggal');

  const handleSave = () => {
    if (!templateName.trim()) { showToast('Nama template wajib diisi', 'warning'); return; }
    if (!currentItems?.length) { showToast('Tidak ada item RAB untuk disimpan', 'warning'); return; }
    saveRABTemplate({
      name: templateName,
      description: templateDesc,
      category: templateCategory,
      rabItems: currentItems,
      financialSettings: currentFinancials || { overhead: 5, profit: 10, tax: 11, contingency: 0 },
    });
    setShowSaveForm(false);
    setTemplateName('');
    setTemplateDesc('');
    showToast('Template berhasil disimpan!', 'success');
  };

  const handleLoad = (template: RABTemplate) => {
    if (!onLoadTemplate) return;
    if (!confirm(`Load template "${template.name}"? Item RAB saat ini akan diganti.`)) return;
    onLoadTemplate(template.rabItems, template.financialSettings);
    showToast(`Template "${template.name}" berhasil dimuat`, 'success');
  };

  const categories = ['Rumah Tinggal', 'Ruko', 'Gedung', 'Renovasi', 'Lainnya'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookTemplate size={18} className="text-primary" />
          <h3 className="text-white font-bold">Template RAB ({rabTemplates.length})</h3>
        </div>
        {currentItems && currentItems.length > 0 && (
          <button onClick={() => setShowSaveForm(!showSaveForm)}
            className="btn-primary text-sm py-2 flex items-center gap-2">
            <Plus size={14} /> Simpan sebagai Template
          </button>
        )}
      </div>

      {/* Save Form */}
      {showSaveForm && (
        <div className="glass-card p-5 space-y-4 border-primary/20">
          <h4 className="text-white font-bold text-sm">Simpan Template Baru</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-bold uppercase tracking-widest">Nama Template</label>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)}
                placeholder="Contoh: Rumah Type 36 Grade B"
                className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-bold uppercase tracking-widest">Kategori</label>
              <select value={templateCategory} onChange={e => setTemplateCategory(e.target.value)}
                className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none appearance-none">
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-secondary font-bold uppercase tracking-widest">Deskripsi (opsional)</label>
            <input value={templateDesc} onChange={e => setTemplateDesc(e.target.value)}
              placeholder="Contoh: Template untuk rumah 1 lantai luas 36m²"
              className="w-full h-11 bg-background border border-border rounded-xl px-4 text-white focus:border-primary outline-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowSaveForm(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button onClick={handleSave} className="btn-primary flex-1 text-sm">Simpan Template</button>
          </div>
        </div>
      )}

      {/* Template List */}
      {rabTemplates.length === 0 ? (
        <div className="glass-card p-10 text-center text-text-secondary">
          <BookTemplate size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada template. Buat RAB lalu simpan sebagai template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rabTemplates.map((tpl: RABTemplate) => {
            const total = tpl.rabItems.reduce((s, i) => s + i.total, 0);
            return (
              <div key={tpl.id} className="glass-card p-5 hover:border-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-bold">{tpl.name}</p>
                    {tpl.description && <p className="text-text-secondary text-xs mt-0.5">{tpl.description}</p>}
                  </div>
                  <button onClick={() => deleteRABTemplate(tpl.id)}
                    className="text-text-secondary hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">
                    <Tag size={10} /> {tpl.category}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-text-secondary">
                    <Clock size={10} /> {new Date(tpl.createdAt).toLocaleDateString('id-ID')}
                  </span>
                  <span className="text-[10px] text-text-secondary">{tpl.rabItems.length} item</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-primary font-black">{formatCurrency(total)}</p>
                  {onLoadTemplate && (
                    <button onClick={() => handleLoad(tpl)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors">
                      <Download size={14} /> Pakai Template
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RABTemplateManager;

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { type RABItem } from '../../store/useStore';
import { formatCurrency } from '../../utils/calculations';
import { AHSP_TEMPLATES } from '../../data/ahsp';
import { getMaterialPricesByGrade, type MaterialGrade } from '../../data/prices';

interface GroupedRABDisplayProps {
  items: RABItem[];
  onUpdateItem: (index: number, updates: Partial<RABItem>) => void;
  onDeleteItem: (index: number) => void;
  onAddItem: () => void;
  onSelectTeam: (itemId: string) => void;
  cityId?: string;
  grade?: MaterialGrade;
}

interface GroupedData {
  kategori: string;
  items: RABItem[];
  subtotal: number;
  totalItems: number;
}

const GroupedRABDisplay = ({
  items,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
  onSelectTeam,
  cityId = '',
  grade = 'B',
}: GroupedRABDisplayProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [tooltipItemId, setTooltipItemId] = useState<string | null>(null);

  // Hitung breakdown material vs upah untuk sebuah item
  const getBreakdown = (item: RABItem) => {
    const template = AHSP_TEMPLATES.find(t => t.name === item.name);
    if (!template) return null;

    const matPrices = getMaterialPricesByGrade(cityId, grade);
    const laborPrices: Record<string, number> = {
      'Pekerja': 150000, 'Tukang Batu': 200000, 'Tukang Besi': 200000,
      'Tukang Cat': 185000, 'Tukang Kayu': 200000, 'Tukang Pipa': 195000,
      'Tukang Listrik': 210000, 'Kepala Tukang': 230000, 'Mandor': 270000,
    };

    const matCost = template.materials.reduce((acc, m) => acc + m.coeff * (matPrices[m.name] || 0), 0);
    const laborCost = template.laborCoefficients.reduce((acc, l) => acc + l.coeff * (laborPrices[l.name] || 0), 0);

    return {
      material: matCost,
      upah: laborCost,
      total: matCost + laborCost,
      details: [
        ...template.materials.map(m => ({
          label: `${m.name} (${m.coeff} ${m.unit})`,
          value: m.coeff * (matPrices[m.name] || 0),
          type: 'material'
        })),
        ...template.laborCoefficients.map(l => ({
          label: `${l.name} (${l.coeff} OH)`,
          value: l.coeff * (laborPrices[l.name] || 0),
          type: 'upah'
        })),
      ]
    };
  };

  // Hitung total upah dari semua item
  const totalUpah = items.reduce((acc, item) => {
    const template = AHSP_TEMPLATES.find(t => t.name === item.name);
    if (!template) return acc;
    const laborPrices: Record<string, number> = {
      'Pekerja': 150000, 'Tukang Batu': 200000, 'Tukang Besi': 200000,
      'Tukang Cat': 185000, 'Tukang Kayu': 200000, 'Tukang Pipa': 195000,
      'Tukang Listrik': 210000, 'Kepala Tukang': 230000, 'Mandor': 270000,
    };
    const laborCost = template.laborCoefficients.reduce((s, l) => s + l.coeff * (laborPrices[l.name] || 0), 0);
    return acc + laborCost * item.volume;
  }, 0);

  const totalMaterial = items.reduce((acc, item) => acc + item.total, 0) - totalUpah;

  // Group items by category
  const groupItems = (): GroupedData[] => {
    const categories: { [key: string]: RABItem[] } = {};

    items.forEach(item => {
      const cat = item.category || 'Lain-lain';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(item);
    });

    return Object.entries(categories)
      .map(([kategori, groupItems]) => ({
        kategori,
        items: groupItems,
        subtotal: groupItems.reduce((sum, item) => sum + item.total, 0),
        totalItems: groupItems.length
      }))
      .sort((a, b) => b.subtotal - a.subtotal);
  };

  const grouped = groupItems();
  const totalAll = grouped.reduce((sum, g) => sum + g.subtotal, 0);

  const toggleCategory = (kategori: string) => {
    setExpandedCategories(prev =>
      prev.includes(kategori)
        ? prev.filter(k => k !== kategori)
        : [...prev, kategori]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-white font-bold uppercase tracking-widest text-xs">
            Detail Item Pekerjaan (Terkelompok)
          </h4>
          <p className="text-text-secondary text-xs">
            Total: {items.length} item | {grouped.length} kategori
          </p>
        </div>
        <button
          onClick={onAddItem}
          className="text-primary hover:text-primary-hover flex items-center gap-2 text-sm font-semibold"
        >
          <Plus size={16} />
          Tambah Pekerjaan
        </button>
      </div>

      {items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-text-secondary italic">
            Belum ada item RAB. Silakan hasilkan RAB terlebih dahulu.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group, groupIdx) => (
            <div key={group.kategori} className="glass-card overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(group.kategori)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-border/10 transition-colors bg-background/50"
              >
                <div className="flex items-center gap-4 flex-1">
                  {expandedCategories.includes(group.kategori) ? (
                    <ChevronUp className="text-primary" size={20} />
                  ) : (
                    <ChevronDown className="text-text-secondary" size={20} />
                  )}
                  <div className="text-left">
                    <h3 className="text-white font-bold text-sm uppercase tracking-wide">
                      {group.kategori}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      {group.totalItems} item • Subtotal: {formatCurrency(group.subtotal)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-sm">
                    {formatCurrency(group.subtotal)}
                  </p>
                </div>
              </button>

              {/* Category Items */}
              {expandedCategories.includes(group.kategori) && (
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full text-left min-w-[960px]">
                    <thead>
                      <tr className="bg-background text-text-secondary text-[10px] uppercase font-bold tracking-widest">
                        <th className="px-4 py-3">No</th>
                        <th className="px-4 py-3">Uraian Pekerjaan</th>
                        <th className="px-4 py-3">Volume</th>
                        <th className="px-4 py-3">Satuan</th>
                        <th className="px-4 py-3">Harga Satuan</th>
                        <th className="px-4 py-3">Jumlah</th>
                        <th className="px-4 py-3">Tim</th>
                        <th className="px-4 py-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {group.items.map((item, itemIdx) => {
                        const itemIndex = items.findIndex(i => i.id === item.id);
                        return (
                          <tr key={item.id} className="hover:bg-border/20 transition-colors">
                            <td className="px-4 py-3 text-text-secondary text-sm">{itemIdx + 1}</td>
                            <td className="px-4 py-3 text-white font-medium text-sm">{item.name}</td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                value={item.volume.toFixed(2)}
                                onChange={(e) => {
                                  const newVolume = parseFloat(e.target.value) || 0;
                                  onUpdateItem(itemIndex, {
                                    ...item,
                                    volume: newVolume,
                                    total: newVolume * item.unitPrice
                                  });
                                }}
                                className="w-20 bg-background border border-border rounded px-2 py-1 text-white text-xs focus:border-primary outline-none"
                              />
                            </td>
                            <td className="px-4 py-3 text-text-secondary text-sm">{item.unit}</td>
                            <td className="px-4 py-3 text-white text-sm font-mono relative">
                              <div className="flex items-center gap-1">
                                <span>{formatCurrency(item.unitPrice)}</span>
                                <button
                                  onClick={() => setTooltipItemId(tooltipItemId === item.id ? null : item.id)}
                                  className="text-text-secondary hover:text-primary transition-colors"
                                >
                                  <Info size={13} />
                                </button>
                              </div>
                              {tooltipItemId === item.id && (() => {
                                const bd = getBreakdown(item);
                                return bd ? (
                                  <div className="absolute left-0 top-10 z-50 w-72 bg-[#121826] border border-primary/30 rounded-xl p-4 shadow-2xl text-xs">
                                    <p className="text-primary font-bold uppercase tracking-widest mb-3">Breakdown Harga Satuan</p>
                                    <div className="space-y-1 mb-3">
                                      <p className="text-text-secondary font-bold uppercase text-[10px] tracking-widest">Material</p>
                                      {bd.details.filter(d => d.type === 'material').map((d, i) => (
                                        <div key={i} className="flex justify-between">
                                          <span className="text-text-secondary">{d.label}</span>
                                          <span className="text-white">{formatCurrency(d.value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="space-y-1 mb-3">
                                      <p className="text-yellow-400 font-bold uppercase text-[10px] tracking-widest">Jasa Tukang (Upah)</p>
                                      {bd.details.filter(d => d.type === 'upah').map((d, i) => (
                                        <div key={i} className="flex justify-between">
                                          <span className="text-text-secondary">{d.label}</span>
                                          <span className="text-yellow-400">{formatCurrency(d.value)}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="border-t border-border pt-2 flex justify-between font-bold">
                                      <span className="text-white">Total/satuan</span>
                                      <span className="text-primary">{formatCurrency(bd.total)}</span>
                                    </div>
                                    <p className="text-text-secondary text-[10px] mt-2 italic">Harga sudah termasuk material + jasa tukang</p>
                                  </div>
                                ) : null;
                              })()}
                            </td>
                            </td>
                            <td className="px-4 py-3 text-white font-bold text-sm">
                              {formatCurrency(item.total)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => onSelectTeam(item.id)}
                                className="text-primary hover:text-primary-hover text-xs font-bold"
                              >
                                {Object.values(item.assignedTeam || {}).reduce((a, b) => a + b, 0)} orang
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => onDeleteItem(itemIndex)}
                                className="text-red-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Subtotal */}
              <div className="px-6 py-3 bg-background/30 border-t border-border flex items-center justify-between font-bold">
                <span className="text-text-secondary uppercase text-xs tracking-wide">
                  Subtotal {group.kategori}
                </span>
                <span className="text-white">{formatCurrency(group.subtotal)}</span>
              </div>
            </div>
          ))}

          {/* Grand Total */}
          <div className="glass-card px-6 py-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-lg uppercase tracking-wide">
                Total Keseluruhan
              </span>
              <span className="text-primary text-2xl font-black">
                {formatCurrency(totalAll)}
              </span>
            </div>
          </div>

          {/* Rekap Material vs Jasa Tukang */}
          <div className="glass-card p-5 border border-border/50">
            <p className="text-text-secondary text-xs font-bold uppercase tracking-widest mb-4">
              Rekap Komponen Biaya
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background/50 rounded-xl p-4 border border-border">
                <p className="text-text-secondary text-xs uppercase tracking-widest mb-1">Biaya Material</p>
                <p className="text-white font-bold text-lg">{formatCurrency(Math.max(0, totalMaterial))}</p>
                <p className="text-text-secondary text-[10px] mt-1">Bahan bangunan, material</p>
              </div>
              <div className="bg-yellow-500/5 rounded-xl p-4 border border-yellow-500/20">
                <p className="text-yellow-400 text-xs uppercase tracking-widest mb-1">Jasa Tukang (Upah)</p>
                <p className="text-yellow-400 font-bold text-lg">{formatCurrency(Math.max(0, totalUpah))}</p>
                <p className="text-text-secondary text-[10px] mt-1">Pekerja, tukang, mandor</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <p className="text-primary text-xs uppercase tracking-widest mb-1">Total RAB</p>
                <p className="text-primary font-bold text-lg">{formatCurrency(totalAll)}</p>
                <p className="text-text-secondary text-[10px] mt-1">Material + Jasa (belum PPN)</p>
              </div>
            </div>
            <p className="text-text-secondary text-[10px] mt-4 italic">
              ⓘ Harga satuan setiap pekerjaan sudah mencakup biaya material DAN jasa tukang sesuai koefisien AHSP/SNI. Klik ikon ⓘ di kolom "Harga Satuan" untuk melihat rincian per item.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupedRABDisplay;

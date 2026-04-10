import { formatCurrency } from '../../utils/calculations';
import { TrendingUp, ChevronUp } from 'lucide-react';

interface StickyTotalBarProps {
  subtotal: number;
  grandTotal: number;
  itemCount: number;
  onScrollToTop?: () => void;
}

/**
 * Sticky Total Bar — tampil di bawah layar saat scroll
 * Mobile-friendly, jempol-friendly
 */
const StickyTotalBar = ({ subtotal, grandTotal, itemCount, onScrollToTop }: StickyTotalBarProps) => {
  if (grandTotal === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:left-64">
      <div className="bg-card border-t-2 border-primary shadow-2xl px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* Left: item count */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest leading-none">Item RAB</p>
              <p className="text-white font-black text-sm">{itemCount}</p>
            </div>
          </div>

          {/* Center: subtotal */}
          <div className="text-center">
            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest leading-none">Subtotal</p>
            <p className="text-white font-bold text-sm">{formatCurrency(subtotal)}</p>
          </div>

          {/* Right: grand total */}
          <div className="text-right">
            <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest leading-none">Grand Total</p>
            <p className="text-primary font-black text-lg leading-tight">{formatCurrency(grandTotal)}</p>
          </div>

          {/* Scroll to top button */}
          {onScrollToTop && (
            <button
              onClick={onScrollToTop}
              className="shrink-0 w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
            >
              <ChevronUp size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyTotalBar;

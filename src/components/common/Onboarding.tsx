import { useState, useEffect } from 'react';
import { X, ChevronRight, Calculator, BookOpen, BarChart3, Layers, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    icon: <Calculator size={32} className="text-primary" />,
    title: 'Kalkulator RAB',
    desc: 'Buat Rencana Anggaran Biaya profesional dengan input data proyek, dimensi bangunan, dan detail ruangan. RAB otomatis digenerate sesuai standar AHSP/SNI.',
  },
  {
    icon: <Layers size={32} className="text-primary" />,
    title: 'AHSP Database',
    desc: 'Akses database Analisis Harga Satuan Pekerjaan (AHSP) lengkap. Filter berdasarkan lokasi dan grade material untuk harga yang akurat.',
  },
  {
    icon: <BarChart3 size={32} className="text-primary" />,
    title: 'Analisis Struktur',
    desc: 'Hitung beban struktur bangunan (beban mati, hidup, angin, gempa) berdasarkan SNI 1727:2020 untuk perencanaan yang aman.',
  },
  {
    icon: <BookOpen size={32} className="text-primary" />,
    title: 'Buku Harian',
    desc: 'Catat progress harian proyek, upload foto lapangan, dan pantau status pekerjaan secara real-time.',
  },
];

const Onboarding = () => {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem('sivilize_onboarding_done');
    if (!seen) setShow(true);
  }, []);

  const finish = () => {
    localStorage.setItem('sivilize_onboarding_done', '1');
    setShow(false);
  };

  if (!show) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      <div className="relative glass-card w-full max-w-md p-8 space-y-6">
        <button onClick={finish} className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors">
          <X size={20} />
        </button>

        <div className="text-center space-y-2">
          <p className="text-text-secondary text-xs uppercase font-bold tracking-widest">Selamat Datang di</p>
          <h2 className="text-2xl font-black text-white">SIVILIZE HUB PRO</h2>
          <p className="text-text-secondary text-sm">Platform RAB & Teknik Sipil Berbasis AI</p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : 'w-2 bg-border'}`} />
          ))}
        </div>

        {/* Content */}
        <div className="bg-background/50 border border-border rounded-2xl p-6 space-y-4 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            {current.icon}
          </div>
          <h3 className="text-white font-bold text-lg">{current.title}</h3>
          <p className="text-text-secondary text-sm leading-relaxed">{current.desc}</p>
        </div>

        <div className="flex gap-3">
          <button onClick={finish} className="btn-secondary flex-1 text-sm">Lewati</button>
          <button
            onClick={() => isLast ? finish() : setStep(s => s + 1)}
            className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm"
          >
            {isLast ? (
              <><CheckCircle2 size={16} /> Mulai Sekarang</>
            ) : (
              <>Selanjutnya <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator, BarChart3, BookOpen, Database, Shield, Smartphone,
  ArrowRight, CheckCircle2, Star, Building2, Users, TrendingUp,
  FileText, Zap, Globe, ChevronDown, Menu, X
} from 'lucide-react';
import { LogoCivil as CivilEngineeringLogo } from '../components/LogoCivil';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage = ({ onGetStarted }: LandingPageProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: Calculator,
      title: 'Kalkulator RAB Otomatis',
      desc: 'Generate RAB lengkap sesuai standar AHSP/SNI hanya dengan input dimensi bangunan. Hemat waktu hingga 80%.',
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      icon: Database,
      title: 'Database AHSP Lengkap',
      desc: '500+ item AHSP dari Permen PUPR No. 1/2022. Harga real-time per kota/kabupaten di seluruh Indonesia.',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      icon: BarChart3,
      title: 'Kurva S & Progress',
      desc: 'Grafik rencana vs realisasi otomatis. Laporan progress siap cetak untuk bank dan owner proyek.',
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      icon: BookOpen,
      title: 'Buku Harian Digital',
      desc: 'Catat progress harian, upload foto lapangan, dan pantau status pekerjaan dari mana saja.',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
    {
      icon: FileText,
      title: 'Export PDF & Excel',
      desc: 'Cetak RAB profesional dengan kop surat, tanda tangan, dan format siap serahkan ke klien.',
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      desc: 'Akses dari HP di lapangan. Tampilan responsif yang nyaman di layar kecil maupun besar.',
      color: 'text-pink-400',
      bg: 'bg-pink-400/10',
    },
  ];

  const stats = [
    { value: '514+', label: 'Kota/Kabupaten', icon: Globe },
    { value: '500+', label: 'Item AHSP', icon: Database },
    { value: '100%', label: 'Standar SNI', icon: Shield },
    { value: 'Gratis', label: 'Untuk Mulai', icon: Zap },
  ];

  const testimonials = [
    {
      name: 'Budi Santoso',
      role: 'Kontraktor, Jakarta',
      text: 'RAB yang biasanya butuh 2 hari sekarang selesai dalam 30 menit. Sangat membantu untuk tender proyek.',
      rating: 5,
    },
    {
      name: 'Siti Rahayu',
      role: 'Estimator, Surabaya',
      text: 'Database AHSP-nya lengkap dan harganya sesuai kondisi lapangan. Laporan ke bank jadi lebih mudah.',
      rating: 5,
    },
    {
      name: 'Ahmad Fauzi',
      role: 'Kontraktor, Makassar',
      text: 'Fitur Kurva S sangat berguna untuk laporan progress ke owner. Tampilan profesional dan mudah digunakan.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      q: 'Apakah SIVILIZE HUB PRO gratis?',
      a: 'Ya, saat ini SIVILIZE HUB PRO dapat digunakan secara gratis. Daftar sekarang dan mulai buat RAB profesional tanpa biaya.',
    },
    {
      q: 'Apakah data proyek saya aman?',
      a: 'Data Anda disimpan di server terenkripsi dengan MongoDB Atlas. Kami menggunakan JWT authentication, rate limiting, dan proteksi berlapis untuk menjaga keamanan data Anda.',
    },
    {
      q: 'Apakah bisa digunakan di HP?',
      a: 'Ya! SIVILIZE HUB PRO dirancang mobile-friendly. Kontraktor di lapangan bisa akses dari HP dengan tampilan yang nyaman.',
    },
    {
      q: 'Standar AHSP apa yang digunakan?',
      a: 'Kami menggunakan standar Permen PUPR No. 1 Tahun 2022 tentang Pedoman Penyusunan Perkiraan Biaya Pekerjaan Konstruksi.',
    },
    {
      q: 'Apakah bisa export ke PDF dan Excel?',
      a: 'Ya, RAB bisa diekspor ke PDF profesional dengan kop surat dan tanda tangan, serta Excel dengan 3 sheet (RAB Detail, Rekapitulasi, AHSP).',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-white">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-glow">
              <CivilEngineeringLogo size={22} variant="icon" className="text-white" />
            </div>
            <span className="font-black text-lg tracking-tight">SIVILIZE HUB PRO</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#fitur" className="text-text-secondary hover:text-white transition-colors text-sm">Fitur</a>
            <a href="#testimoni" className="text-text-secondary hover:text-white transition-colors text-sm">Testimoni</a>
            <a href="#faq" className="text-text-secondary hover:text-white transition-colors text-sm">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button onClick={onGetStarted} className="text-text-secondary hover:text-white transition-colors text-sm font-medium px-4 py-2">
              Masuk
            </button>
            <button onClick={onGetStarted} className="btn-primary py-2 px-5 text-sm">
              Daftar Gratis
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 text-text-secondary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card border-b border-border px-4 py-4 space-y-3">
            <a href="#fitur" className="block text-text-secondary hover:text-white py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>Fitur</a>
            <a href="#testimoni" className="block text-text-secondary hover:text-white py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>Testimoni</a>
            <a href="#faq" className="block text-text-secondary hover:text-white py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <button onClick={onGetStarted} className="btn-primary w-full py-2.5 text-sm mt-2">Daftar Gratis</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-4 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-primary text-sm font-bold mb-8">
            <Zap size={14} />
            Platform RAB #1 untuk Kontraktor Indonesia
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-tight">
            Buat RAB Profesional{' '}
            <span className="text-primary">dalam 30 Menit</span>
          </h1>

          <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform teknik sipil berbasis AI untuk kontraktor Indonesia. Hitung RAB otomatis sesuai AHSP/SNI, buat laporan progress, dan kelola proyek dari satu tempat.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onGetStarted}
              className="btn-primary flex items-center justify-center gap-2 py-4 px-8 text-base group"
            >
              Mulai Gratis Sekarang
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#fitur"
              className="flex items-center justify-center gap-2 py-4 px-8 text-base border border-border rounded-xl text-text-secondary hover:text-white hover:border-primary/50 transition-all"
            >
              Lihat Fitur
              <ChevronDown size={18} />
            </a>
          </div>

          <p className="text-text-secondary text-sm mt-6">
            ✓ Gratis &nbsp;·&nbsp; ✓ Tanpa kartu kredit &nbsp;·&nbsp; ✓ Langsung bisa dipakai
          </p>
        </motion.div>

        {/* Hero image / mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-16 relative"
        >
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl max-w-5xl mx-auto">
            <div className="bg-background/50 border-b border-border px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="text-text-secondary text-xs ml-2">sivilize-frontend.vercel.app</span>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Proyek', value: '12', color: 'text-blue-400' },
                { label: 'RAB Draft', value: '3', color: 'text-primary' },
                { label: 'Total Anggaran', value: 'Rp 4,2M', color: 'text-green-400' },
                { label: 'Lokasi Proyek', value: '8 Kota', color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={i} className="bg-background/60 border border-border rounded-xl p-4">
                  <p className="text-text-secondary text-xs mb-1">{stat.label}</p>
                  <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <div className="bg-background/60 border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-sm font-bold">Proyek Terbaru</span>
                  <span className="text-primary text-xs">Lihat Semua</span>
                </div>
                {['Rumah Pak Budi - Jakarta', 'Ruko 2 Lantai - Surabaya', 'Renovasi Kantor - Bandung'].map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-text-secondary text-sm">{p}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${i === 0 ? 'bg-primary/20 text-primary' : i === 1 ? 'bg-green-500/20 text-green-400' : 'bg-border text-text-secondary'}`}>
                      {i === 0 ? 'ongoing' : i === 1 ? 'completed' : 'draft'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-4 lg:px-8 border-y border-border bg-card/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-primary">
                  <Icon size={24} />
                </div>
                <p className="text-3xl font-black text-white mb-1">{stat.value}</p>
                <p className="text-text-secondary text-sm">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── FITUR ── */}
      <section id="fitur" className="py-24 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Semua yang Lo Butuhkan</h2>
          <p className="text-text-secondary max-w-xl mx-auto">Dari hitung RAB sampai laporan progress — semua ada di satu platform.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all group"
              >
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 ${f.color} group-hover:scale-110 transition-transform`}>
                  <Icon size={24} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── CARA KERJA ── */}
      <section className="py-24 px-4 lg:px-8 bg-card/30 border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Cara Kerjanya Simpel</h2>
            <p className="text-text-secondary">3 langkah untuk RAB profesional</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Input Data Proyek', desc: 'Masukkan nama proyek, lokasi, dimensi bangunan, dan spesifikasi ruangan.' },
              { step: '02', title: 'Generate RAB Otomatis', desc: 'Sistem otomatis menghitung semua item pekerjaan sesuai standar AHSP/SNI.' },
              { step: '03', title: 'Export & Bagikan', desc: 'Download PDF/Excel profesional atau bagikan link read-only ke klien.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="text-6xl font-black text-primary/10 mb-4">{item.step}</div>
                <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                <p className="text-text-secondary leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONI ── */}
      <section id="testimoni" className="py-24 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Kata Mereka</h2>
          <p className="text-text-secondary">Kontraktor dan estimator yang sudah pakai SIVILIZE HUB PRO</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array(t.rating).fill(0).map((_, j) => (
                  <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                  {t.name[0]}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-text-secondary text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-4 lg:px-8 bg-card/30 border-y border-border">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Pertanyaan Umum</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="text-white font-medium">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-text-secondary transition-transform shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-text-secondary text-sm leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 lg:px-8 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-glow">
            <Building2 size={32} className="text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black mb-6">
            Siap Buat RAB Lebih Cepat?
          </h2>
          <p className="text-text-secondary text-lg mb-10 max-w-xl mx-auto">
            Bergabung dengan kontraktor Indonesia yang sudah pakai SIVILIZE HUB PRO. Gratis, tanpa kartu kredit.
          </p>
          <button
            onClick={onGetStarted}
            className="btn-primary flex items-center gap-2 mx-auto py-4 px-10 text-lg group"
          >
            Daftar Gratis Sekarang
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="flex items-center justify-center gap-6 mt-8 text-text-secondary text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" /> Gratis selamanya</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" /> Data aman terenkripsi</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-400" /> Standar AHSP/SNI</span>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="text-white font-bold text-sm">SIVILIZE HUB PRO</span>
          </div>
          <p className="text-text-secondary text-sm">© {new Date().getFullYear()} SIVILIZE HUB PRO. All rights reserved.</p>
          <div className="flex items-center gap-4 text-text-secondary text-sm">
            <button onClick={onGetStarted} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={onGetStarted} className="hover:text-white transition-colors">Terms of Service</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { type RABItem, type FinancialSettings, type Project } from '../store/useStore';
import { calculateTotalRAB, getGroupedRABItems } from './calculations';
import { getCityDisplayName, type MaterialGrade } from '../data/prices';

const groupAndExportRAB = (items: RABItem[]) =>
  getGroupedRABItems(items).filter(g => g.items.length > 0);

type JsPDFWithAutoTable = jsPDF & {
  autoTable: (options: unknown) => void;
  lastAutoTable?: { finalY: number };
};

// Format angka ke Rupiah: Rp 100.000.000
const toRp = (n: number): string =>
  'Rp ' + Math.round(n).toLocaleString('id-ID');

// ============================================================
// EXPORT PDF PROFESIONAL
// ============================================================
export const exportToPDF = (
  project: Partial<Project>,
  items: RABItem[],
  financials: FinancialSettings,
  grade: MaterialGrade,
  options?: { companyName?: string; preparedBy?: string; approvedBy?: string; projectNo?: string }
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as unknown as JsPDFWithAutoTable;
  const summary = calculateTotalRAB(items, financials);
  const grouped = groupAndExportRAB(items);
  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;
  const company = options?.companyName || 'SIVILIZE HUB PRO';
  const preparedBy = options?.preparedBy || '-';
  const approvedBy = options?.approvedBy || '-';
  const projectNo = options?.projectNo || `SIV-${Date.now().toString().slice(-6)}`;

  // KOP SURAT
  doc.setDrawColor(255, 122, 0); doc.setLineWidth(1.5);
  doc.line(margin, 12, pageW - margin, 12);
  doc.setFillColor(255, 122, 0);
  doc.roundedRect(margin, 15, 18, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('SHP', margin + 9, 25, { align: 'center' });
  doc.setTextColor(30, 30, 30); doc.setFontSize(16);
  doc.text(company, margin + 22, 21);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text('Platform Teknik Sipil Berbasis AI', margin + 22, 26);
  doc.text('sivilize-frontend.vercel.app', margin + 22, 30);
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 122, 0);
  doc.text('RENCANA ANGGARAN BIAYA', pageW - margin, 19, { align: 'right' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(`No. Dokumen: ${projectNo}`, pageW - margin, 24, { align: 'right' });
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW - margin, 28, { align: 'right' });
  doc.setDrawColor(255, 122, 0); doc.setLineWidth(0.5);
  doc.line(margin, 36, pageW - margin, 36);

  // INFO PROYEK
  let y = 42;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'S');
  const col1 = margin + 4, col2 = margin + contentW / 2 + 4;
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
  ['Nama Proyek', 'Lokasi', 'Grade Material'].forEach((l, i) => doc.text(l, col1, y + 5 + i * 6));
  ['Estimator', 'Status', 'Tgl Laporan'].forEach((l, i) => doc.text(l, col2, y + 5 + i * 6));
  doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
  [`: ${project.name || '-'}`, `: ${getCityDisplayName(project.location || '-')}`, `: Grade ${grade}`].forEach((v, i) => doc.text(v, col1 + 28, y + 5 + i * 6));
  [`: ${preparedBy}`, `: ${project.status || 'draft'}`, `: ${new Date().toLocaleDateString('id-ID')}`].forEach((v, i) => doc.text(v, col2 + 28, y + 5 + i * 6));
  y += 28;

  // TABEL RAB
  let itemNo = 1;
  grouped.forEach((group) => {
    doc.setFillColor(255, 122, 0); doc.setTextColor(255, 255, 255);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.rect(margin, y, contentW, 7, 'F');
    doc.text(group.kategori.toUpperCase(), margin + 3, y + 5);
    y += 7;
    const tableData = group.items.map((item: RABItem) => [
      itemNo++, item.name, item.volume.toFixed(3), item.unit,
      toRp(item.unitPrice), toRp(item.total),
    ]);
    tableData.push(['', `SUBTOTAL ${group.kategori.toUpperCase()}`, '', '', '', toRp(group.subtotal)]);
    (doc as unknown as JsPDFWithAutoTable).autoTable({
      startY: y,
      head: [['No', 'Uraian Pekerjaan', 'Volume', 'Sat', 'Harga Satuan', 'Jumlah']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 30, 30] },
      headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' }, 1: { cellWidth: 65 },
        2: { cellWidth: 18, halign: 'right' }, 3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' }, 5: { cellWidth: 35, halign: 'right' },
      },
      didParseCell: (data: { row: { index: number }; section: string; cell: { styles: { fontStyle: string; fillColor: number[] } } }) => {
        if (data.section === 'body' && data.row.index === tableData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
      margin: { left: margin, right: margin },
    });
    y = ((doc as unknown as JsPDFWithAutoTable).lastAutoTable?.finalY ?? y) + 4;
  });

  // RINGKASAN
  y += 4;
  const summaryX = pageW - margin - 80;
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
  doc.line(summaryX, y, pageW - margin, y); y += 4;
  const addRow = (label: string, value: number, bold = false) => {
    doc.setFontSize(8.5); doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(bold ? 30 : 80, bold ? 30 : 80, bold ? 30 : 80);
    doc.text(label, summaryX, y);
    doc.text(toRp(value), pageW - margin, y, { align: 'right' });
    y += 5.5;
  };
  addRow('Subtotal Pekerjaan', summary.subtotal);
  addRow(`Overhead (${financials.overhead}%)`, summary.overheadAmount);
  addRow(`Profit (${financials.profit}%)`, summary.profitAmount);
  if (financials.contingency > 0) addRow(`Biaya Tak Terduga (${financials.contingency}%)`, summary.contingencyAmount);
  addRow(`PPN (${financials.tax}%)`, summary.taxAmount);
  doc.setDrawColor(255, 122, 0); doc.setLineWidth(0.8);
  doc.line(summaryX, y, pageW - margin, y); y += 2;
  doc.setFillColor(255, 122, 0); doc.rect(summaryX, y, 80, 8, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', summaryX + 2, y + 5.5);
  doc.text(toRp(summary.grandTotal), pageW - margin, y + 5.5, { align: 'right' });
  y += 14;

  // TANDA TANGAN
  if (y > 240) { doc.addPage(); y = 20; }
  y += 6;
  const sigColW = contentW / 3;
  [{ title: 'Dibuat Oleh', name: preparedBy, role: 'Estimator' },
   { title: 'Diperiksa Oleh', name: '-', role: 'Kepala Estimator' },
   { title: 'Disetujui Oleh', name: approvedBy, role: 'Direktur / Owner' }
  ].forEach((box, i) => {
    const x = margin + i * sigColW;
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.3);
    doc.rect(x, y, sigColW - 4, 30, 'S');
    doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30); doc.setFontSize(8);
    doc.text(box.title, x + (sigColW - 4) / 2, y + 5, { align: 'center' });
    doc.setDrawColor(150, 150, 150);
    doc.line(x + 6, y + 22, x + sigColW - 10, y + 22);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(60, 60, 60);
    doc.text(box.name, x + (sigColW - 4) / 2, y + 26, { align: 'center' });
    doc.text(box.role, x + (sigColW - 4) / 2, y + 30, { align: 'center' });
  });

  // FOOTER
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setTextColor(150, 150, 150);
    doc.text(`SIVILIZE HUB PRO — Halaman ${i} dari ${pageCount}`, pageW / 2, 290, { align: 'center' });
    doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
    doc.line(margin, 287, pageW - margin, 287);
  }
  doc.save(`RAB_${(project.name || 'Proyek').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================================
// EXPORT EXCEL PROFESIONAL — Tabel rapi, format Rp, siap kontraktor
// Menggunakan pendekatan AOA (Array of Arrays) yang kompatibel
// dengan semua versi XLSX
// ============================================================
export const exportToExcel = (
  project: Partial<Project>,
  items: RABItem[],
  financials: FinancialSettings,
  grade: MaterialGrade,
  options?: { companyName?: string; preparedBy?: string; approvedBy?: string; projectNo?: string }
) => {
  const summary = calculateTotalRAB(items, financials);
  const grouped = groupAndExportRAB(items);
  const wb = XLSX.utils.book_new();
  const company = options?.companyName || 'SIVILIZE HUB PRO';
  const preparedBy = options?.preparedBy || '-';
  const approvedBy = options?.approvedBy || '-';
  const projectNo = options?.projectNo || `SIV-${Date.now().toString().slice(-6)}`;
  const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

  // ── Sheet 1: RAB Detail ────────────────────────────────────
  const data: (string | number)[][] = [];

  // KOP SURAT
  data.push([company]);
  data.push(['RENCANA ANGGARAN BIAYA (RAB)']);
  data.push(['Platform Teknik Sipil Berbasis AI | sivilize-frontend.vercel.app']);
  data.push(['']);

  // INFO PROYEK — 2 kolom
  data.push(['Nama Proyek', ':', project.name || '-', '', 'No. Dokumen', ':', projectNo]);
  data.push(['Lokasi', ':', getCityDisplayName(project.location || '-'), '', 'Tanggal', ':', today]);
  data.push(['Grade Material', ':', `Grade ${grade}`, '', 'Dibuat Oleh', ':', preparedBy]);
  data.push(['Status', ':', project.status || 'draft', '', 'Disetujui', ':', approvedBy]);
  data.push(['']);

  // HEADER TABEL
  data.push(['No', 'Uraian Pekerjaan', 'Volume', 'Satuan', 'Harga Satuan', 'Jumlah (Rp)']);
  const headerRowIdx = data.length; // untuk referensi

  // DATA RAB
  let itemNo = 1;
  grouped.forEach(group => {
    // Category header
    data.push([group.kategori.toUpperCase(), '', '', '', '', toRp(group.subtotal)]);

    // Items
    group.items.forEach((item: RABItem) => {
      data.push([
        itemNo++,
        item.name,
        Number(item.volume.toFixed(3)),
        item.unit,
        toRp(item.unitPrice),
        toRp(item.total),
      ]);
    });

    // Subtotal
    data.push(['', `SUBTOTAL ${group.kategori.toUpperCase()}`, '', '', '', toRp(group.subtotal)]);
    data.push(['']); // empty row
  });

  // RINGKASAN KEUANGAN
  data.push(['']);
  data.push(['', '', '', '', 'Subtotal Pekerjaan', toRp(summary.subtotal)]);
  data.push(['', '', '', '', `Overhead (${financials.overhead}%)`, toRp(summary.overheadAmount)]);
  data.push(['', '', '', '', `Profit Kontraktor (${financials.profit}%)`, toRp(summary.profitAmount)]);
  if (financials.contingency > 0)
    data.push(['', '', '', '', `Biaya Tak Terduga (${financials.contingency}%)`, toRp(summary.contingencyAmount)]);
  data.push(['', '', '', '', `PPN (${financials.tax}%)`, toRp(summary.taxAmount)]);
  data.push(['', '', '', '', 'GRAND TOTAL', toRp(summary.grandTotal)]);
  data.push(['']);

  // TANDA TANGAN
  data.push(['Dibuat Oleh', '', 'Diperiksa Oleh', '', 'Disetujui Oleh', '']);
  data.push(['', '', '', '', '', '']);
  data.push(['', '', '', '', '', '']);
  data.push(['', '', '', '', '', '']);
  data.push([`(${preparedBy})`, '', '(-)', '', `(${approvedBy})`, '']);
  data.push(['Estimator', '', 'Kepala Estimator', '', 'Direktur / Owner', '']);

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set lebar kolom
  ws['!cols'] = [
    { wch: 5 },   // A: No
    { wch: 45 },  // B: Uraian
    { wch: 12 },  // C: Volume
    { wch: 10 },  // D: Satuan
    { wch: 25 },  // E: Harga Satuan
    { wch: 25 },  // F: Jumlah
    { wch: 15 },  // G: extra
  ];

  // Merge cells untuk kop surat
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },  // Nama perusahaan
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },  // Judul
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },  // Subtitle
  ];

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: headerRowIdx };

  XLSX.utils.book_append_sheet(wb, ws, 'RAB Detail');

  // ── Sheet 2: Rekapitulasi ──────────────────────────────────
  const rekapData: (string | number)[][] = [
    [company],
    ['REKAPITULASI RENCANA ANGGARAN BIAYA'],
    [''],
    ['No', 'Uraian Pekerjaan', 'Jumlah (Rp)', '% dari Total'],
    ...grouped.map((g, i) => [
      i + 1,
      g.kategori,
      toRp(g.subtotal),
      `${((g.subtotal / summary.subtotal) * 100).toFixed(2)}%`
    ]),
    [''],
    ['', 'Subtotal Pekerjaan', toRp(summary.subtotal), '100%'],
    ['', `Overhead & Profit (${financials.overhead + financials.profit}%)`, toRp(summary.overheadAmount + summary.profitAmount), ''],
    ['', `PPN (${financials.tax}%)`, toRp(summary.taxAmount), ''],
    ['', 'GRAND TOTAL', toRp(summary.grandTotal), ''],
  ];
  const wsRekap = XLSX.utils.aoa_to_sheet(rekapData);
  wsRekap['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 25 }, { wch: 15 }];
  wsRekap['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekapitulasi');

  // ── Sheet 3: AHSP ──────────────────────────────────────────
  const ahspData: (string | number)[][] = [
    ['ANALISA HARGA SATUAN PEKERJAAN (AHSP)'],
    ['Referensi: Permen PUPR No. 1 Tahun 2022'],
    [''],
    ['No', 'Uraian Pekerjaan', 'Satuan', 'Harga Satuan', 'Kategori'],
    ...items.map((item, i) => [i + 1, item.name, item.unit, toRp(item.unitPrice), item.category]),
  ];
  const wsAHSP = XLSX.utils.aoa_to_sheet(ahspData);
  wsAHSP['!cols'] = [{ wch: 5 }, { wch: 45 }, { wch: 10 }, { wch: 25 }, { wch: 15 }];
  wsAHSP['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsAHSP, 'AHSP');

  const filename = `RAB_${(project.name || 'Proyek').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

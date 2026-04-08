import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { type RABItem, type FinancialSettings, type Project } from '../store/useStore';
import { formatCurrency, calculateTotalRAB, getGroupedRABItems } from './calculations';
import { getCityDisplayName, type MaterialGrade } from '../data/prices';

const groupAndExportRAB = (items: RABItem[]) =>
  getGroupedRABItems(items).filter(g => g.items.length > 0);

type JsPDFWithAutoTable = jsPDF & {
  autoTable: (options: unknown) => void;
  lastAutoTable?: { finalY: number };
};

// ============================================================
// EXPORT PDF PROFESIONAL — Layout A4, Kop Surat, Tanda Tangan
// ============================================================
export const exportToPDF = (
  project: Partial<Project>,
  items: RABItem[],
  financials: FinancialSettings,
  grade: MaterialGrade,
  options?: {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    preparedBy?: string;
    approvedBy?: string;
    projectNo?: string;
  }
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as unknown as JsPDFWithAutoTable;
  const summary = calculateTotalRAB(items, financials);
  const grouped = groupAndExportRAB(items);
  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;

  const company = options?.companyName || 'SIVILIZE HUB PRO';
  const address = options?.companyAddress || 'Platform Teknik Sipil Berbasis AI';
  const phone = options?.companyPhone || 'sivilize-frontend.vercel.app';
  const preparedBy = options?.preparedBy || '-';
  const approvedBy = options?.approvedBy || '-';
  const projectNo = options?.projectNo || `SIV-${Date.now().toString().slice(-6)}`;

  // ── KOP SURAT ──────────────────────────────────────────────
  // Garis atas tebal
  doc.setDrawColor(255, 122, 0);
  doc.setLineWidth(1.5);
  doc.line(margin, 12, pageW - margin, 12);

  // Logo area (kiri)
  doc.setFillColor(255, 122, 0);
  doc.roundedRect(margin, 15, 18, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SHP', margin + 9, 25, { align: 'center' });

  // Nama perusahaan (kanan logo)
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(company, margin + 22, 21);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(address, margin + 22, 26);
  doc.text(phone, margin + 22, 30);

  // Judul dokumen (kanan)
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 122, 0);
  doc.text('RENCANA ANGGARAN BIAYA', pageW - margin, 19, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`No. Dokumen: ${projectNo}`, pageW - margin, 24, { align: 'right' });
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW - margin, 28, { align: 'right' });

  // Garis bawah kop
  doc.setDrawColor(255, 122, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, 36, pageW - margin, 36);

  // ── INFO PROYEK ────────────────────────────────────────────
  let y = 42;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'S');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  const col1 = margin + 4;
  const col2 = margin + contentW / 2 + 4;

  doc.text('Nama Proyek', col1, y + 5);
  doc.text('Lokasi', col1, y + 11);
  doc.text('Grade Material', col1, y + 17);
  doc.text('Estimator', col2, y + 5);
  doc.text('Status', col2, y + 11);
  doc.text('Tgl Laporan', col2, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(`: ${project.name || '-'}`, col1 + 28, y + 5);
  doc.text(`: ${getCityDisplayName(project.location || '-')}`, col1 + 28, y + 11);
  doc.text(`: Grade ${grade}`, col1 + 28, y + 17);
  doc.text(`: ${preparedBy}`, col2 + 28, y + 5);
  doc.text(`: ${project.status || 'draft'}`, col2 + 28, y + 11);
  doc.text(`: ${new Date().toLocaleDateString('id-ID')}`, col2 + 28, y + 17);

  y += 28;

  // ── TABEL RAB PER KATEGORI ─────────────────────────────────
  let itemNo = 1;
  grouped.forEach((group) => {
    // Category header
    doc.setFillColor(255, 122, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.rect(margin, y, contentW, 7, 'F');
    doc.text(group.kategori.toUpperCase(), margin + 3, y + 5);
    y += 7;

    const tableData = group.items.map((item: RABItem) => [
      itemNo++,
      item.name,
      item.volume.toFixed(3),
      item.unit,
      formatCurrency(item.unitPrice),
      formatCurrency(item.total),
    ]);

    tableData.push([
      '', `SUBTOTAL ${group.kategori.toUpperCase()}`, '', '', '',
      formatCurrency(group.subtotal)
    ]);

    (doc as unknown as JsPDFWithAutoTable).autoTable({
      startY: y,
      head: [['No', 'Uraian Pekerjaan', 'Volume', 'Sat', 'Harga Satuan (Rp)', 'Jumlah (Rp)']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 30, 30] },
      headStyles: { fillColor: [52, 73, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 18, halign: 'right' },
        3: { cellWidth: 12, halign: 'center' },
        4: { cellWidth: 35, halign: 'right' },
        5: { cellWidth: 35, halign: 'right' },
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

  // ── RINGKASAN KEUANGAN ─────────────────────────────────────
  y += 4;
  const summaryX = pageW - margin - 80;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(summaryX, y, pageW - margin, y);
  y += 4;

  const addSummaryRow = (label: string, value: number, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(bold ? 30 : 80, bold ? 30 : 80, bold ? 30 : 80);
    doc.text(label, summaryX, y);
    doc.text(formatCurrency(value), pageW - margin, y, { align: 'right' });
    y += 5.5;
  };

  addSummaryRow('Subtotal Pekerjaan', summary.subtotal);
  addSummaryRow(`Overhead (${financials.overhead}%)`, summary.overheadAmount);
  addSummaryRow(`Profit Kontraktor (${financials.profit}%)`, summary.profitAmount);
  if (financials.contingency > 0)
    addSummaryRow(`Biaya Tak Terduga (${financials.contingency}%)`, summary.contingencyAmount);
  addSummaryRow(`PPN (${financials.tax}%)`, summary.taxAmount);

  doc.setDrawColor(255, 122, 0);
  doc.setLineWidth(0.8);
  doc.line(summaryX, y, pageW - margin, y);
  y += 2;

  doc.setFillColor(255, 122, 0);
  doc.rect(summaryX, y, 80, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAND TOTAL', summaryX + 2, y + 5.5);
  doc.text(formatCurrency(summary.grandTotal), pageW - margin, y + 5.5, { align: 'right' });
  y += 14;

  // ── KOLOM TANDA TANGAN ─────────────────────────────────────
  // Cek apakah masih cukup ruang, kalau tidak tambah halaman baru
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  y += 6;
  const sigColW = contentW / 3;

  const sigBoxes = [
    { title: 'Dibuat Oleh', name: preparedBy, role: 'Estimator' },
    { title: 'Diperiksa Oleh', name: '-', role: 'Kepala Estimator' },
    { title: 'Disetujui Oleh', name: approvedBy, role: 'Direktur / Owner' },
  ];

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  sigBoxes.forEach((box, i) => {
    const x = margin + i * sigColW;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(x, y, sigColW - 4, 30, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text(box.title, x + (sigColW - 4) / 2, y + 5, { align: 'center' });

    // Garis tanda tangan
    doc.setDrawColor(150, 150, 150);
    doc.line(x + 6, y + 22, x + sigColW - 10, y + 22);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text(box.name, x + (sigColW - 4) / 2, y + 26, { align: 'center' });
    doc.text(box.role, x + (sigColW - 4) / 2, y + 30, { align: 'center' });
  });

  // ── FOOTER ─────────────────────────────────────────────────
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Dokumen ini digenerate oleh SIVILIZE HUB PRO — Halaman ${i} dari ${pageCount}`,
      pageW / 2, 290, { align: 'center' }
    );
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 287, pageW - margin, 287);
  }

  const filename = `RAB_${(project.name || 'Proyek').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

// ============================================================
// EXPORT EXCEL PROFESIONAL
// ============================================================
export const exportToExcel = (
  project: Partial<Project>,
  items: RABItem[],
  financials: FinancialSettings,
  grade: MaterialGrade
) => {
  const summary = calculateTotalRAB(items, financials);
  const grouped = groupAndExportRAB(items);
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: RAB Detail ────────────────────────────────────
  const rabData: (string | number | undefined)[][] = [];
  rabData.push(['RENCANA ANGGARAN BIAYA (RAB)']);
  rabData.push([]);
  rabData.push(['Nama Kegiatan:', project.name]);
  rabData.push(['Lokasi:', getCityDisplayName(project.location || '-')]);
  rabData.push(['Tanggal:', new Date().toLocaleDateString('id-ID')]);
  rabData.push(['Grade Material:', `Grade ${grade}`]);
  rabData.push(['No. Dokumen:', `SIV-${Date.now().toString().slice(-6)}`]);
  rabData.push([]);
  rabData.push(['No', 'Uraian Pekerjaan', 'Volume', 'Satuan', 'Harga Satuan (Rp)', 'Jumlah (Rp)']);

  let itemNo = 1;
  grouped.forEach(group => {
    rabData.push([group.kategori.toUpperCase()]);
    group.items.forEach((item: RABItem) => {
      rabData.push([itemNo++, item.name, Number(item.volume.toFixed(3)), item.unit, item.unitPrice, item.total]);
    });
    rabData.push(['', `SUBTOTAL ${group.kategori}`, '', '', '', group.subtotal]);
    rabData.push([]);
  });

  rabData.push([]);
  rabData.push(['RINGKASAN KEUANGAN']);
  rabData.push(['Subtotal Pekerjaan', '', '', '', '', summary.subtotal]);
  rabData.push([`Overhead (${financials.overhead}%)`, '', '', '', '', summary.overheadAmount]);
  rabData.push([`Profit (${financials.profit}%)`, '', '', '', '', summary.profitAmount]);
  if (financials.contingency > 0)
    rabData.push([`Biaya Tak Terduga (${financials.contingency}%)`, '', '', '', '', summary.contingencyAmount]);
  rabData.push([`PPN (${financials.tax}%)`, '', '', '', '', summary.taxAmount]);
  rabData.push(['GRAND TOTAL', '', '', '', '', summary.grandTotal]);

  const wsRAB = XLSX.utils.aoa_to_sheet(rabData);
  wsRAB['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsRAB, 'RAB Detail');

  // ── Sheet 2: Ringkasan ─────────────────────────────────────
  const summaryData: (string | number | undefined)[][] = [
    ['RINGKASAN BIAYA PROYEK'],
    [],
    ['Nama Proyek', project.name],
    ['Lokasi', getCityDisplayName(project.location || '-')],
    ['Grade Material', `Grade ${grade}`],
    ['Tanggal', new Date().toLocaleDateString('id-ID')],
    [],
    ['Komponen Biaya', 'Nilai (Rp)', 'Persentase'],
    ['Subtotal Pekerjaan', summary.subtotal, '100%'],
    [`Overhead (${financials.overhead}%)`, summary.overheadAmount, `${financials.overhead}%`],
    [`Profit (${financials.profit}%)`, summary.profitAmount, `${financials.profit}%`],
    [`PPN (${financials.tax}%)`, summary.taxAmount, `${financials.tax}%`],
    ['GRAND TOTAL', summary.grandTotal, ''],
    [],
    ['Rekapitulasi per Kategori'],
    ['Kategori', 'Jumlah Item', 'Subtotal (Rp)', '% dari Total'],
    ...grouped.map(g => [
      g.kategori,
      g.items.length,
      g.subtotal,
      `${((g.subtotal / summary.subtotal) * 100).toFixed(1)}%`
    ]),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // ── Sheet 3: AHSP Detail ───────────────────────────────────
  const ahspData: (string | number)[][] = [
    ['ANALISA HARGA SATUAN PEKERJAAN (AHSP)'],
    [],
    ['No', 'Uraian', 'Satuan', 'Harga Satuan (Rp)', 'Kategori'],
    ...items.map((item, i) => [i + 1, item.name, item.unit, item.unitPrice, item.category]),
  ];
  const wsAHSP = XLSX.utils.aoa_to_sheet(ahspData);
  wsAHSP['!cols'] = [{ wch: 5 }, { wch: 40 }, { wch: 10 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsAHSP, 'AHSP');

  const filename = `RAB_${(project.name || 'Proyek').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

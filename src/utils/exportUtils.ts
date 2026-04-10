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

  // KOP SURAT
  doc.setDrawColor(255, 122, 0);
  doc.setLineWidth(1.5);
  doc.line(margin, 12, pageW - margin, 12);
  doc.setFillColor(255, 122, 0);
  doc.roundedRect(margin, 15, 18, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SHP', margin + 9, 25, { align: 'center' });
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.text(company, margin + 22, 21);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(address, margin + 22, 26);
  doc.text(phone, margin + 22, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 122, 0);
  doc.text('RENCANA ANGGARAN BIAYA', pageW - margin, 19, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`No. Dokumen: ${projectNo}`, pageW - margin, 24, { align: 'right' });
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageW - margin, 28, { align: 'right' });
  doc.setDrawColor(255, 122, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, 36, pageW - margin, 36);

  // INFO PROYEK
  let y = 42;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentW, 22, 2, 2, 'S');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 80, 80);
  const col1 = margin + 4, col2 = margin + contentW / 2 + 4;
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

  // TABEL RAB
  let itemNo = 1;
  grouped.forEach((group) => {
    doc.setFillColor(255, 122, 0);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.rect(margin, y, contentW, 7, 'F');
    doc.text(group.kategori.toUpperCase(), margin + 3, y + 5);
    y += 7;
    const tableData = group.items.map((item: RABItem) => [
      itemNo++, item.name, item.volume.toFixed(3), item.unit,
      formatCurrency(item.unitPrice), formatCurrency(item.total),
    ]);
    tableData.push(['', `SUBTOTAL ${group.kategori.toUpperCase()}`, '', '', '', formatCurrency(group.subtotal)]);
    (doc as unknown as JsPDFWithAutoTable).autoTable({
      startY: y,
      head: [['No', 'Uraian Pekerjaan', 'Volume', 'Sat', 'Harga Satuan (Rp)', 'Jumlah (Rp)']],
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
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(summaryX, y, pageW - margin, y);
  y += 4;
  const addRow = (label: string, value: number, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(bold ? 30 : 80, bold ? 30 : 80, bold ? 30 : 80);
    doc.text(label, summaryX, y);
    doc.text(formatCurrency(value), pageW - margin, y, { align: 'right' });
    y += 5.5;
  };
  addRow('Subtotal Pekerjaan', summary.subtotal);
  addRow(`Overhead (${financials.overhead}%)`, summary.overheadAmount);
  addRow(`Profit (${financials.profit}%)`, summary.profitAmount);
  if (financials.contingency > 0) addRow(`Biaya Tak Terduga (${financials.contingency}%)`, summary.contingencyAmount);
  addRow(`PPN (${financials.tax}%)`, summary.taxAmount);
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

  // TANDA TANGAN
  if (y > 240) { doc.addPage(); y = 20; }
  y += 6;
  const sigColW = contentW / 3;
  [
    { title: 'Dibuat Oleh', name: preparedBy, role: 'Estimator' },
    { title: 'Diperiksa Oleh', name: '-', role: 'Kepala Estimator' },
    { title: 'Disetujui Oleh', name: approvedBy, role: 'Direktur / Owner' },
  ].forEach((box, i) => {
    const x = margin + i * sigColW;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(x, y, sigColW - 4, 30, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);
    doc.text(box.title, x + (sigColW - 4) / 2, y + 5, { align: 'center' });
    doc.setDrawColor(150, 150, 150);
    doc.line(x + 6, y + 22, x + sigColW - 10, y + 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text(box.name, x + (sigColW - 4) / 2, y + 26, { align: 'center' });
    doc.text(box.role, x + (sigColW - 4) / 2, y + 30, { align: 'center' });
  });

  // FOOTER
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Dokumen ini digenerate oleh SIVILIZE HUB PRO — Halaman ${i} dari ${pageCount}`, pageW / 2, 290, { align: 'center' });
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, 287, pageW - margin, 287);
  }

  doc.save(`RAB_${(project.name || 'Proyek').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================================
// EXPORT EXCEL PROFESIONAL — Tabel berformat, kop surat, border
// Referensi: format RAB kontraktor standar Indonesia
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
  const ws = XLSX.utils.aoa_to_sheet([]);

  // Helper set cell
  const setCell = (ws: XLSX.WorkSheet, addr: string, value: string | number, style?: object) => {
    if (!ws[addr]) ws[addr] = {};
    ws[addr].v = value;
    ws[addr].t = typeof value === 'number' ? 'n' : 's';
    if (style) ws[addr].s = style;
  };

  // Styles
  const styleTitle = { font: { bold: true, sz: 16, color: { rgb: 'FF7A00' } }, alignment: { horizontal: 'center', vertical: 'center' } };
  const styleSubtitle = { font: { bold: true, sz: 11 }, alignment: { horizontal: 'center' } };
  const styleHeader = { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '34495E' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
  const styleCatHeader = { font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: 'FF7A00' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } } };
  const styleData = { font: { sz: 9 }, alignment: { vertical: 'center' }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
  const styleDataRight = { ...styleData, alignment: { horizontal: 'right', vertical: 'center' } };
  const styleDataCenter = { ...styleData, alignment: { horizontal: 'center', vertical: 'center' } };
  const styleSubtotal = { font: { bold: true, sz: 9 }, fill: { fgColor: { rgb: 'E8F4FD' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: { top: { style: 'medium' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } };
  const styleGrandTotal = { font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: 'FF7A00' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } } };
  const styleLabel = { font: { bold: true, sz: 9 }, alignment: { horizontal: 'left', vertical: 'center' } };
  const styleValue = { font: { sz: 9 }, alignment: { horizontal: 'left', vertical: 'center' } };
  const numFmt = '#,##0';

  let row = 1;

  // KOP SURAT
  setCell(ws, `A${row}`, company, styleTitle);
  ws[`!merges`] = ws[`!merges`] || [];
  ws['!merges'].push({ s: { r: row - 1, c: 0 }, e: { r: row - 1, c: 5 } });
  row++;

  setCell(ws, `A${row}`, 'RENCANA ANGGARAN BIAYA (RAB)', styleSubtitle);
  ws['!merges'].push({ s: { r: row - 1, c: 0 }, e: { r: row - 1, c: 5 } });
  row++;

  setCell(ws, `A${row}`, 'Platform Teknik Sipil Berbasis AI — sivilize-frontend.vercel.app', { font: { sz: 8, italic: true, color: { rgb: '888888' } }, alignment: { horizontal: 'center' } });
  ws['!merges'].push({ s: { r: row - 1, c: 0 }, e: { r: row - 1, c: 5 } });
  row += 2;

  // INFO PROYEK
  const infoRows = [
    ['Nama Proyek', project.name || '-', '', 'No. Dokumen', projectNo],
    ['Lokasi', getCityDisplayName(project.location || '-'), '', 'Tanggal', today],
    ['Grade Material', `Grade ${grade}`, '', 'Dibuat Oleh', preparedBy],
    ['Status', project.status || 'draft', '', 'Disetujui', approvedBy],
  ];
  infoRows.forEach(([l1, v1, , l2, v2]) => {
    setCell(ws, `A${row}`, l1 as string, styleLabel);
    setCell(ws, `B${row}`, v1 as string, styleValue);
    ws['!merges'].push({ s: { r: row - 1, c: 1 }, e: { r: row - 1, c: 2 } });
    setCell(ws, `D${row}`, l2 as string, styleLabel);
    setCell(ws, `E${row}`, v2 as string, styleValue);
    ws['!merges'].push({ s: { r: row - 1, c: 4 }, e: { r: row - 1, c: 5 } });
    row++;
  });
  row++;

  // HEADER TABEL
  const headers = ['No', 'Uraian Pekerjaan', 'Volume', 'Satuan', 'Harga Satuan (Rp)', 'Jumlah (Rp)'];
  headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    setCell(ws, `${col}${row}`, h, styleHeader);
  });
  const headerRow = row;
  row++;

  // DATA RAB
  let itemNo = 1;
  grouped.forEach((group) => {
    // Category header row
    setCell(ws, `A${row}`, group.kategori.toUpperCase(), styleCatHeader);
    ws['!merges'].push({ s: { r: row - 1, c: 0 }, e: { r: row - 1, c: 4 } });
    setCell(ws, `F${row}`, group.subtotal, { ...styleCatHeader, alignment: { horizontal: 'right', vertical: 'center' }, numFmt });
    ws[`F${row}`].z = numFmt;
    row++;

    // Items
    group.items.forEach((item: RABItem) => {
      setCell(ws, `A${row}`, itemNo++, styleDataCenter);
      setCell(ws, `B${row}`, item.name, styleData);
      setCell(ws, `C${row}`, Number(item.volume.toFixed(3)), styleDataRight);
      ws[`C${row}`].z = '#,##0.000';
      setCell(ws, `D${row}`, item.unit, styleDataCenter);
      setCell(ws, `E${row}`, item.unitPrice, styleDataRight);
      ws[`E${row}`].z = numFmt;
      setCell(ws, `F${row}`, item.total, styleDataRight);
      ws[`F${row}`].z = numFmt;
      row++;
    });

    // Subtotal row
    setCell(ws, `A${row}`, '', styleSubtotal);
    setCell(ws, `B${row}`, `SUBTOTAL ${group.kategori.toUpperCase()}`, { ...styleSubtotal, alignment: { horizontal: 'left', vertical: 'center' } });
    ws['!merges'].push({ s: { r: row - 1, c: 1 }, e: { r: row - 1, c: 4 } });
    setCell(ws, `F${row}`, group.subtotal, styleSubtotal);
    ws[`F${row}`].z = numFmt;
    row++;
    row++; // empty row
  });

  row++;

  // RINGKASAN KEUANGAN
  const summaryItems = [
    ['Subtotal Pekerjaan', summary.subtotal],
    [`Overhead & Profit (${financials.overhead + financials.profit}%)`, summary.overheadAmount + summary.profitAmount],
    ...(financials.contingency > 0 ? [[`Biaya Tak Terduga (${financials.contingency}%)`, summary.contingencyAmount]] : []),
    [`PPN (${financials.tax}%)`, summary.taxAmount],
  ] as [string, number][];

  summaryItems.forEach(([label, value]) => {
    setCell(ws, `E${row}`, label, { font: { sz: 9 }, alignment: { horizontal: 'right' } });
    setCell(ws, `F${row}`, value, { font: { sz: 9 }, alignment: { horizontal: 'right' }, border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } } });
    ws[`F${row}`].z = numFmt;
    row++;
  });

  // Grand Total
  setCell(ws, `E${row}`, 'GRAND TOTAL', styleGrandTotal);
  setCell(ws, `F${row}`, summary.grandTotal, styleGrandTotal);
  ws[`F${row}`].z = numFmt;
  ws['!merges'].push({ s: { r: row - 1, c: 4 }, e: { r: row - 1, c: 4 } });
  row += 3;

  // TANDA TANGAN
  ['Dibuat Oleh', 'Diperiksa Oleh', 'Disetujui Oleh'].forEach((title, i) => {
    const col = String.fromCharCode(65 + i * 2);
    setCell(ws, `${col}${row}`, title, { font: { bold: true, sz: 9 }, alignment: { horizontal: 'center' } });
  });
  row += 4;
  [preparedBy, '-', approvedBy].forEach((name, i) => {
    const col = String.fromCharCode(65 + i * 2);
    setCell(ws, `${col}${row}`, `(${name})`, { font: { sz: 9 }, alignment: { horizontal: 'center' } });
  });

  // Set column widths
  ws['!cols'] = [
    { wch: 5 },   // A: No
    { wch: 42 },  // B: Uraian
    { wch: 12 },  // C: Volume
    { wch: 10 },  // D: Satuan
    { wch: 22 },  // E: Harga Satuan
    { wch: 22 },  // F: Jumlah
  ];

  // Set row heights
  ws['!rows'] = [];
  ws['!rows'][0] = { hpt: 30 }; // title
  ws['!rows'][1] = { hpt: 22 }; // subtitle
  ws['!rows'][headerRow - 1] = { hpt: 30 }; // table header

  // Set print area & page setup
  ws['!pageSetup'] = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1 };
  ws['!printTitles'] = { rows: { s: headerRow - 1, e: headerRow - 1 } };

  XLSX.utils.book_append_sheet(wb, ws, 'RAB Detail');

  // ── Sheet 2: Rekapitulasi ──────────────────────────────────
  const wsRekap = XLSX.utils.aoa_to_sheet([
    [company],
    ['REKAPITULASI RENCANA ANGGARAN BIAYA'],
    [],
    ['No', 'Uraian Pekerjaan', 'Jumlah (Rp)', '% dari Total'],
    ...grouped.map((g, i) => [
      i + 1,
      g.kategori,
      g.subtotal,
      `${((g.subtotal / summary.subtotal) * 100).toFixed(2)}%`
    ]),
    [],
    ['', 'Subtotal', summary.subtotal, '100%'],
    ['', `Overhead & Profit (${financials.overhead + financials.profit}%)`, summary.overheadAmount + summary.profitAmount, ''],
    ['', `PPN (${financials.tax}%)`, summary.taxAmount, ''],
    ['', 'GRAND TOTAL', summary.grandTotal, ''],
  ]);
  wsRekap['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 22 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekapitulasi');

  // ── Sheet 3: AHSP ──────────────────────────────────────────
  const wsAHSP = XLSX.utils.aoa_to_sheet([
    ['ANALISA HARGA SATUAN PEKERJAAN (AHSP)'],
    ['Referensi: Permen PUPR No. 1 Tahun 2022'],
    [],
    ['No', 'Uraian Pekerjaan', 'Satuan', 'Harga Satuan (Rp)', 'Kategori'],
    ...items.map((item, i) => [i + 1, item.name, item.unit, item.unitPrice, item.category]),
  ]);
  wsAHSP['!cols'] = [{ wch: 5 }, { wch: 42 }, { wch: 10 }, { wch: 22 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsAHSP, 'AHSP');

  const filename = `RAB_${(project.name || 'Proyek').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};

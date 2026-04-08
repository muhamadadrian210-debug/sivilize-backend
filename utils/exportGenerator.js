const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { groupRABItems } = require('./rabClassifier');

/**
 * Group RAB items by category
 */
const groupRABItemsLocal = (items) => {
  const categories = {
    'Pekerjaan Persiapan': [],
    'Pekerjaan Tanah': [],
    'Pekerjaan Struktur': [],
    'Pekerjaan Dinding': [],
    'Pekerjaan Lantai': [],
    'Pekerjaan Finishing': [],
    'Pekerjaan Atap': [],
    'Lain-lain': []
  };

  items.forEach(item => {
    const category = item.category || item.name;
    let foundCategory = false;

    // Try to match with keywords
    const keywords = {
      'Pekerjaan Struktur': ['galian', 'pondasi', 'beton', 'pembesian', 'baja', 'kolom', 'balok', 'plat'],
      'Pekerjaan Persiapan': ['persiapan', 'pembersihan', 'survey', 'mobilisasi'],
      'Pekerjaan Tanah': ['urugan', 'timbunan', 'tanah', 'pemadatan'],
      'Pekerjaan Dinding': ['pasangan', 'bata', 'plesteran', 'dinding'],
      'Pekerjaan Lantai': ['keramik', 'granit', 'marmer', 'lantai'],
      'Pekerjaan Finishing': ['pengecatan', 'cat', 'finishing', 'kaca', 'pintu'],
      'Pekerjaan Atap': ['atap', 'genteng', 'roofing']
    };

    for (const [catName, kw] of Object.entries(keywords)) {
      if (kw.some(k => item.name.toLowerCase().includes(k))) {
        categories[catName].push(item);
        foundCategory = true;
        break;
      }
    }

    if (!foundCategory) {
      categories['Lain-lain'].push(item);
    }
  });

  // Return only non-empty categories
  return Object.entries(categories)
    .filter(([, items]) => items.length > 0)
    .map(([name, items]) => ({
      name,
      items,
      subtotal: items.reduce((sum, item) => sum + (item.total || 0), 0)
    }));
};

/**
 * Format currency to RPY format
 */
const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

const generateRABPDF = (project, items, summary, financials) => {
  const doc = new PDFDocument();

  // Add content to PDF (simplified for demo)
  doc.fontSize(20).text('SIVILIZE HUB PRO - RAB Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(14).text(`Project Name: ${project?.name || '-'}`);
  doc.text(`Location: ${project?.location || '-'}`);
  doc.moveDown();

  // Table header
  doc.fontSize(12).text('No | Item Name | Volume | Unit | Unit Price | Total');
  doc.moveDown(0.5);

  (items || []).forEach((item, index) => {
    doc.text(`${index + 1} | ${item.name || '-'} | ${item.volume || 0} | ${item.unit || '-'} | ${item.unitPrice || 0} | ${item.total || 0}`);
  });

  doc.moveDown();
  doc.text(`Grand Total: ${summary?.grandTotal || 0}`);

  doc.end();
  return doc;
};

/**
 * Generate professional RAB Excel with grouped structure
 */
const generateRABExcel = async (project, items, summary, financials) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('RAB Profesional');

  // Define styles
  const titleStyle = {
    font: { name: 'Calibri', size: 18, bold: true, color: { argb: 'FF1F4E78' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const headerStyle = {
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  const categoryHeaderStyle = {
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    }
  };

  const dataStyle = {
    font: { name: 'Calibri', size: 10 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  const subtotalStyle = {
    font: { name: 'Calibri', size: 10, bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  const grandTotalStyle = {
    font: { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: {
      top: { style: 'medium' },
      left: { style: 'thin' },
      bottom: { style: 'medium' },
      right: { style: 'thin' }
    }
  };

  // Set column widths
  worksheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Uraian Pekerjaan', key: 'name', width: 35 },
    { header: 'Volume', key: 'volume', width: 12 },
    { header: 'Satuan', key: 'unit', width: 10 },
    { header: 'Harga Satuan', key: 'unitPrice', width: 15 },
    { header: 'Jumlah Harga', key: 'total', width: 15 }
  ];

  // Add title
  worksheet.mergeCells('A1:F1');
  const titleRow = worksheet.getCell('A1');
  titleRow.value = 'RENCANA ANGGARAN BIAYA (RAB)';
  titleRow.style = titleStyle;
  worksheet.getRow(1).height = 25;

  // Add project info
  let row = 2;
  worksheet.mergeCells(`A${row}:F${row}`);
  worksheet.getCell(`A${row}`).value = '';
  row++;

  const infoStyle = {
    font: { name: 'Calibri', size: 10 },
    alignment: { horizontal: 'left', vertical: 'center' }
  };

  worksheet.mergeCells(`A${row}:B${row}`);
  worksheet.getCell(`A${row}`).value = 'Nama Kegiatan:';
  worksheet.getCell(`C${row}`).value = project.name || '';
  worksheet.getCell(`A${row}`).font = { bold: true };
  worksheet.getCell(`C${row}`).alignment = { horizontal: 'left' };
  row++;

  worksheet.mergeCells(`A${row}:B${row}`);
  worksheet.getCell(`A${row}`).value = 'Lokasi:';
  worksheet.getCell(`C${row}`).value = project.location || '';
  worksheet.getCell(`A${row}`).font = { bold: true };
  worksheet.getCell(`C${row}`).alignment = { horizontal: 'left' };
  row++;

  worksheet.mergeCells(`A${row}:B${row}`);
  worksheet.getCell(`A${row}`).value = 'Tanggal:';
  worksheet.getCell(`C${row}`).value = new Date().toLocaleDateString('id-ID');
  worksheet.getCell(`A${row}`).font = { bold: true };
  worksheet.getCell(`C${row}`).alignment = { horizontal: 'left' };
  row += 2;

  // Add table headers
  const headerRow = worksheet.getRow(row);
  headerRow.values = ['No', 'Uraian Pekerjaan', 'Volume', 'Satuan', 'Harga Satuan', 'Jumlah Harga'];
  headerRow.eachCell(cell => {
    cell.style = headerStyle;
  });
  worksheet.getRow(row).height = 20;
  row++;

  // Group items and add to worksheet
  const grouped = groupRABItemsLocal(items);
  let itemNo = 1;
  let grandTotal = 0;

  grouped.forEach((group) => {
    // Category header
    const catRow = worksheet.getRow(row);
    catRow.values = [null, group.name, null, null, null, null];
    catRow.getCell('B').style = categoryHeaderStyle;
    catRow.height = 18;
    row++;

    // Items in category
    group.items.forEach((item) => {
      const dataRow = worksheet.getRow(row);
      dataRow.values = [
        itemNo++,
        item.name,
        item.volume ? item.volume.toFixed(3) : 0,
        item.unit,
        item.unitPrice,
        item.total
      ];

      dataRow.eachCell((cell, colNum) => {
        cell.style = { ...dataStyle };
        
        // Format currency columns
        if (colNum === 5 || colNum === 6) {
          cell.numFmt = '[DBNum1][$-804]#,##0';
          cell.alignment = { ...dataStyle.alignment, horizontal: 'right' };
        }
      });
      row++;
    });

    // Subtotal for category
    const subtotalRow = worksheet.getRow(row);
    subtotalRow.values = [null, `SUBTOTAL ${group.name.toUpperCase()}`, null, null, null, group.subtotal];
    subtotalRow.getCell('F').style = subtotalStyle;
    subtotalRow.getCell('F').numFmt = '[DBNum1][$-804]#,##0';
    row++;

    grandTotal += group.subtotal;
    row++; // Empty row between categories
  });

  // Add financial summary
  row++;
  worksheet.mergeCells(`A${row}:E${row}`);
  worksheet.getCell(`A${row}`).value = 'Subtotal Pekerjaan';
  worksheet.getCell(`A${row}`).font = { bold: true };
  worksheet.getCell(`F${row}`).value = grandTotal;
  worksheet.getCell(`F${row}`).numFmt = '[DBNum1][$-804]#,##0';
  row++;

  const overheadAmount = (grandTotal * (financials.overhead || 5)) / 100;
  worksheet.mergeCells(`A${row}:E${row}`);
  worksheet.getCell(`A${row}`).value = `Overhead & Profit (${(financials.overhead || 5) + (financials.profit || 10)}%)`;
  worksheet.getCell(`A${row}`).font = { bold: true };
  worksheet.getCell(`F${row}`).value = overheadAmount + ((grandTotal * (financials.profit || 10)) / 100);
  worksheet.getCell(`F${row}`).numFmt = '[DBNum1][$-804]#,##0';
  row++;

  const totalBeforeTax = grandTotal + overheadAmount + ((grandTotal * (financials.profit || 10)) / 100) + ((grandTotal * (financials.contingency || 0)) / 100);
  const taxAmount = (totalBeforeTax * (financials.tax || 11)) / 100;

  worksheet.mergeCells(`A${row}:E${row}`);
  worksheet.getCell(`A${row}`).value = `PPN (${financials.tax || 11}%)`;
  worksheet.getCell(`A${row}`).font = { bold: true };
  worksheet.getCell(`F${row}`).value = taxAmount;
  worksheet.getCell(`F${row}`).numFmt = '[DBNum1][$-804]#,##0';
  row++;

  // Grand total
  row++;
  worksheet.mergeCells(`A${row}:E${row}`);
  const grandTotalCell = worksheet.getCell(`A${row}`);
  grandTotalCell.value = 'TOTAL KESELURUHAN';
  grandTotalCell.style = grandTotalStyle;
  
  const grandTotalValueCell = worksheet.getCell(`F${row}`);
  grandTotalValueCell.value = totalBeforeTax + taxAmount;
  grandTotalValueCell.numFmt = '[DBNum1][$-804]#,##0';
  grandTotalValueCell.style = grandTotalStyle;
  worksheet.getRow(row).height = 22;

  // Add summary sheet
  const summarySheet = workbook.addWorksheet('Ringkasan');
  summarySheet.columns = [
    { header: 'Keterangan', key: 'description', width: 25 },
    { header: 'Nilai', key: 'value', width: 15 }
  ];

  const summaryData = [
    { description: 'Nama Proyek', value: project.name },
    { description: 'Lokasi', value: project.location },
    { description: 'Tanggal', value: new Date().toLocaleDateString('id-ID') },
    { description: '', value: '' },
    { description: 'RINGKASAN BIAYA', value: '' },
    { description: 'Subtotal Pekerjaan', value: grandTotal },
    { description: 'Overhead & Profit', value: overheadAmount + ((grandTotal * (financials.profit || 10)) / 100) },
    { description: 'PPN', value: taxAmount },
    { description: 'TOTAL KESELURUHAN', value: totalBeforeTax + taxAmount }
  ];

  summarySheet.addRows(summaryData);
  summarySheet.getColumn('B').numFmt = '[DBNum1][$-804]#,##0';

  return workbook;
};

module.exports = {
  generateRABPDF,
  generateRABExcel,
  formatRupiah
};

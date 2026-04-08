const { generateRABPDF, generateRABExcel } = require('../utils/exportGenerator');

// @desc    Export RAB to PDF
// @route   POST /api/export/pdf
// @access  Private
exports.exportPDF = async (req, res, next) => {
  try {
    const { project, items, summary, financials } = req.body;
    
    const projectName = (project?.name || 'RAB').replace(/[^a-zA-Z0-9_\-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=RAB_${projectName}.pdf`);
    
    const doc = generateRABPDF(project, items, summary, financials);
    doc.pipe(res);
  } catch (err) {
    next(err);
  }
};

// @desc    Export RAB to Excel
// @route   POST /api/export/excel
// @access  Private
exports.exportExcel = async (req, res, next) => {
  try {
    const { project, items, summary, financials } = req.body;
    
    const projectName = (project?.name || 'RAB').replace(/[^a-zA-Z0-9_\-]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=RAB_${projectName}.xlsx`);
    
    const workbook = await generateRABExcel(project, items, summary, financials);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

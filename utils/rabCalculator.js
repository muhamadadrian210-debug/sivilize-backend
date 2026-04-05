// server/utils/rabCalculator.js

const calculateVolumeFromDimensions = (dimensions) => {
  let totalArea = 0;
  let totalVolume = 0;

  dimensions.forEach((dim) => {
    const area = dim.length * dim.width;
    totalArea += area;
    totalVolume += area * dim.height;
  });

  return { totalArea, totalVolume };
};

const calculateTotalRAB = (items, settings) => {
  const subtotal = items.reduce((acc, item) => acc + item.total, 0);
  const overheadAmount = (subtotal * settings.overhead) / 100;
  const profitAmount = (subtotal * settings.profit) / 100;
  const contingencyAmount = (subtotal * (settings.contingency || 0)) / 100;
  
  const totalBeforeTax = subtotal + overheadAmount + profitAmount + contingencyAmount;
  const taxAmount = (totalBeforeTax * settings.tax) / 100;
  
  const grandTotal = totalBeforeTax + taxAmount;

  return {
    subtotal,
    overheadAmount,
    profitAmount,
    contingencyAmount,
    taxAmount,
    grandTotal,
  };
};

module.exports = {
  calculateVolumeFromDimensions,
  calculateTotalRAB
};

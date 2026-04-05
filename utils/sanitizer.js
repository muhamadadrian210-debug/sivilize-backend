const xss = require('xss');

const sanitizeString = (str) => {
  if (!str) return '';
  return xss(str.toString().trim());
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return {};
  
  const sanitized = {};
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeString(obj[key]);
    } else if (Array.isArray(obj[key])) {
      sanitized[key] = obj[key].map(item =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else if (obj[key] && typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

module.exports = { sanitizeString, sanitizeObject };

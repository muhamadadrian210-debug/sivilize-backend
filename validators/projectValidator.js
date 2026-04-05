const joi = require('joi');

const projectSchema = joi.object({
  name: joi.string()
    .trim()
    .required()
    .min(3)
    .max(100)
    .messages({
      'string.empty': 'Nama project diperlukan',
      'string.min': 'Nama minimal 3 karakter',
      'string.max': 'Nama maksimal 100 karakter'
    }),
  
  description: joi.string()
    .trim()
    .max(2000)
    .allow('')
    .messages({
      'string.max': 'Deskripsi maksimal 2000 karakter'
    }),
  
  location: joi.string()
    .trim()
    .max(200)
    .allow('')
    .messages({
      'string.max': 'Lokasi maksimal 200 karakter'
    }),
  
  type: joi.string()
    .trim()
    .valid('residensial', 'komersial', 'industri', 'infrastruktur')
    .optional()
    .messages({
      'any.only': 'Tipe project tidak valid'
    }),
  
  status: joi.string()
    .trim()
    .valid('planning', 'in_progress', 'completed', 'on_hold')
    .optional()
    .messages({
      'any.only': 'Status tidak valid'
    }),
  
  startDate: joi.date()
    .required()
    .messages({
      'date.base': 'Format tanggal mulai tidak valid',
      'any.required': 'Tanggal mulai diperlukan'
    }),
  
  endDate: joi.date()
    .min(joi.ref('startDate'))
    .required()
    .messages({
      'date.base': 'Format tanggal selesai tidak valid',
      'date.min': 'Tanggal selesai harus setelah tanggal mulai',
      'any.required': 'Tanggal selesai diperlukan'
    }),
  
  budget: joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Budget harus berupa angka',
      'number.positive': 'Budget harus lebih dari 0',
      'any.required': 'Budget diperlukan'
    }),
  
  manpower: joi.number()
    .positive()
    .allow(0)
    .optional()
    .messages({
      'number.base': 'Jumlah manpower harus berupa angka',
      'number.positive': 'Jumlah manpower harus 0 atau lebih'
    })
});

const validateProject = (data) => {
  return projectSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

module.exports = {
  validateProject
};

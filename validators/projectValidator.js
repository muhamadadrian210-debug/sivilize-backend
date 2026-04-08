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

  location: joi.string()
    .trim()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Lokasi maksimal 200 karakter'
    }),

  type: joi.string()
    .trim()
    .valid('rumah', 'ruko', 'gedung')
    .optional()
    .messages({
      'any.only': 'Tipe project hanya bisa: rumah, ruko, atau gedung'
    }),

  floors: joi.number()
    .integer()
    .min(1)
    .optional()
    .messages({
      'number.base': 'Jumlah lantai harus berupa angka',
      'number.min': 'Jumlah lantai minimal 1'
    }),

  dimensions: joi.array()
    .items(joi.object({
      length: joi.number().positive().required(),
      width: joi.number().positive().required(),
      height: joi.number().positive().required()
    }))
    .optional(),

  status: joi.string()
    .trim()
    .valid('draft', 'ongoing', 'completed')
    .optional()
    .messages({
      'any.only': 'Status hanya bisa: draft, ongoing, atau completed'
    }),

  versions: joi.array().optional(),

  // Extra fields from frontend store (allowed but not required)
  materialGrade: joi.string().valid('A', 'B', 'C').optional(),
  roofModel: joi.string().optional(),
  bedroomCount: joi.number().min(0).optional(),
  bathroomCount: joi.number().min(0).optional(),
  doorCount: joi.number().min(0).optional(),
  windowCount: joi.number().min(0).optional(),
  waterPointCount: joi.number().min(0).optional(),
  drainPointCount: joi.number().min(0).optional(),
  drinkingPointCount: joi.number().min(0).optional(),
  lightPointCount: joi.number().min(0).optional(),
  socketPointCount: joi.number().min(0).optional(),
  toiletType: joi.string().valid('duduk', 'jongkok').optional(),
  dailyLogs: joi.array().optional()
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

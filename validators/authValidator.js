const joi = require('joi');

const registerSchema = joi.object({
  name: joi.string()
    .trim()
    .required()
    .min(2)
    .max(50)
    .messages({
      'string.empty': 'Nama diperlukan',
      'string.min': 'Nama minimal 2 karakter',
      'string.max': 'Nama maksimal 50 karakter'
    }),
  
  email: joi.string()
    .trim()
    .email()
    .required()
    .messages({
      'string.empty': 'Email diperlukan',
      'string.email': 'Format email tidak valid',
      'any.required': 'Email adalah required'
    }),
  
  password: joi.string()
    .required()
    .min(6)
    .max(100)
    .messages({
      'string.empty': 'Password diperlukan',
      'string.min': 'Password minimal 6 karakter',
      'any.required': 'Password adalah required'
    }),
  
  role: joi.string()
    .trim()
    .valid('user', 'admin', 'client')
    .optional()
    .messages({
      'any.only': 'Role hanya bisa: user, admin, atau client'
    })
});

const loginSchema = joi.object({
  email: joi.string()
    .trim()
    .email()
    .required()
    .messages({
      'string.empty': 'Email diperlukan',
      'string.email': 'Format email tidak valid'
    }),
  
  password: joi.string()
    .required()
    .messages({
      'string.empty': 'Password diperlukan'
    })
});

const validateRegister = (data) => {
  return registerSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

const validateLogin = (data) => {
  return loginSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
};

module.exports = {
  validateRegister,
  validateLogin
};

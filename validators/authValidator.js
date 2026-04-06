const joi = require('joi');

const registerSchema = joi.object({
  name: joi.string()
    .trim()
    .required()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      'string.empty': 'Nama diperlukan',
      'string.min': 'Nama minimal 2 karakter',
      'string.max': 'Nama maksimal 50 karakter',
      'string.pattern.base': 'Nama hanya boleh huruf dan spasi'
    }),

  email: joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .required()
    .max(100)
    .messages({
      'string.empty': 'Email diperlukan',
      'string.email': 'Format email tidak valid',
      'any.required': 'Email diperlukan'
    }),

  // Password kuat: min 8 karakter, huruf besar, huruf kecil, angka, simbol
  password: joi.string()
    .required()
    .min(8)
    .max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{8,}$/)
    .messages({
      'string.empty': 'Password diperlukan',
      'string.min': 'Password minimal 8 karakter',
      'string.pattern.base': 'Password harus mengandung huruf besar, huruf kecil, angka, dan simbol (@$!%*?&_-#)',
      'any.required': 'Password diperlukan'
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
    .email({ tlds: { allow: false } })
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

module.exports = { validateRegister, validateLogin };

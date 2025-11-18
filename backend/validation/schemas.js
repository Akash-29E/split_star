import Joi from 'joi';

// ===== JOI VALIDATION SCHEMAS =====

// User validation schema
export const userSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .optional()
    .allow('')
    .messages({
      'string.email': 'Please enter a valid email'
    }),
  
  pin: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .optional()
    .messages({
      'string.length': 'PIN must be exactly 6 digits',
      'string.pattern.base': 'PIN must contain only numbers'
    }),
  
  defaultRole: Joi.string()
    .valid('admin', 'member', 'viewer')
    .default('member'),
  
  defaultAccessLevel: Joi.string()
    .valid('full', 'limited', 'readonly')
    .default('limited')
});

// Group validation schema
export const groupSchema = Joi.object({
  groupName: Joi.string()
    .min(1)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.empty': 'Group name is required',
      'string.max': 'Group name cannot exceed 100 characters',
      'any.required': 'Group name is required'
    }),
  
  description: Joi.string()
    .max(500)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  personCount: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .required()
    .messages({
      'number.min': 'Group must have at least 1 person',
      'number.max': 'Group cannot exceed 50 people',
      'any.required': 'Person count is required'
    }),
  
  personNames: Joi.object()
    .pattern(Joi.string(), Joi.string().min(1).max(50))
    .optional()
});

// Split validation schema with conditional validation
export const splitSchema = Joi.object({
  groupId: Joi.string()
    .required()
    .messages({
      'string.empty': 'Group ID is required',
      'any.required': 'Group ID is required'
    }),
  
  splitTitle: Joi.string()
    .min(1)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.empty': 'Split title is required',
      'string.max': 'Split title cannot exceed 200 characters',
      'any.required': 'Split title is required'
    }),
  
  splitDescription: Joi.string()
    .max(1000)
    .trim()
    .optional()
    .allow('')
    .messages({
      'string.max': 'Split description cannot exceed 1000 characters'
    }),
  
  splitType: Joi.string()
    .valid('split', 'subsplit')
    .default('split'),
  
  baseAmount: Joi.number()
    .positive()
    .required()
    .messages({
      'number.positive': 'Base amount must be positive',
      'any.required': 'Base amount is required'
    }),
  
  taxPercentage: Joi.number()
    .min(0)
    .max(100)
    .default(0)
    .messages({
      'number.min': 'Tax percentage cannot be negative',
      'number.max': 'Tax percentage cannot exceed 100%'
    }),
  
  splitMethod: Joi.string()
    .valid('equal', 'amount', 'percentage', 'shares')
    .required()
    .messages({
      'any.only': 'Split method must be one of: equal, amount, percentage, shares',
      'any.required': 'Split method is required'
    }),
  
  memberSplits: Joi.array()
    .items(
      Joi.object({
        memberId: Joi.string()
          .required()
          .messages({
            'any.required': 'Member ID is required'
          }),
        
        memberName: Joi.string()
          .min(1)
          .trim()
          .required()
          .messages({
            'string.empty': 'Member name is required',
            'any.required': 'Member name is required'
          }),
        
        isParticipating: Joi.boolean()
          .default(true),
        
        splitValue: Joi.object({
          amount: Joi.number()
            .min(0)
            .when('$splitMethod', {
              is: 'amount',
              then: Joi.required(),
              otherwise: Joi.optional().default(0)
            })
            .messages({
              'number.min': 'Split amount cannot be negative'
            }),
          
          percentage: Joi.number()
            .min(0)
            .max(100)
            .when('$splitMethod', {
              is: 'percentage',
              then: Joi.required(),
              otherwise: Joi.optional().default(0)
            })
            .messages({
              'number.min': 'Split percentage cannot be negative',
              'number.max': 'Split percentage cannot exceed 100%'
            }),
          
          shares: Joi.number()
            .integer()
            .min(1)
            .when('$splitMethod', {
              is: 'shares',
              then: Joi.required(),
              otherwise: Joi.optional().default(1)
            })
            .messages({
              'number.min': 'Split shares must be at least 1',
              'number.integer': 'Split shares must be a whole number'
            })
        }).required(),
        
        paidAmount: Joi.number()
          .min(0)
          .default(0)
          .messages({
            'number.min': 'Paid amount cannot be negative'
          }),
        
        paymentStatus: Joi.string()
          .valid('pending', 'partial', 'paid')
          .default('pending')
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one member must participate',
      'any.required': 'Member splits are required'
    }),
  
  paidBy: Joi.string()
    .required()
    .messages({
      'any.required': 'Paid by is required'
    }),
  
  paidByName: Joi.string()
    .min(1)
    .trim()
    .required()
    .messages({
      'string.empty': 'Paid by name is required',
      'any.required': 'Paid by name is required'
    }),
  
  createdBy: Joi.string()
    .required()
    .messages({
      'any.required': 'Creator is required'
    }),
  
  createdByName: Joi.string()
    .min(1)
    .trim()
    .required()
    .messages({
      'string.empty': 'Creator name is required',
      'any.required': 'Creator name is required'
    }),
  
  splitStatus: Joi.string()
    .valid('draft', 'active', 'completed', 'cancelled')
    .default('draft')
})
.custom((value, helpers) => {
  // Custom validation for percentage splits
  if (value.splitMethod === 'percentage') {
    const participatingMembers = value.memberSplits.filter(member => member.isParticipating);
    const totalPercentage = participatingMembers.reduce((sum, member) => {
      return sum + (member.splitValue?.percentage || 0);
    }, 0);
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return helpers.error('custom.percentageSum');
    }
  }
  
  return value;
})
.messages({
  'custom.percentageSum': 'Split percentages must add up to 100%'
});

// Authentication schemas
export const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(30)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .trim()
    .required()
    .messages({
      'string.min': 'Username must be at least 3 characters',
      'string.max': 'Username cannot exceed 30 characters',
      'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
      'any.required': 'Username is required'
    }),
  
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please enter a valid email',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
  
  firstName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  
  lastName: Joi.string()
    .min(1)
    .max(50)
    .trim()
    .required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    })
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please enter a valid email',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

// PIN verification schema
export const pinVerificationSchema = Joi.object({
  uuid: Joi.string()
    .required()
    .messages({
      'string.empty': 'Group UUID is required',
      'any.required': 'Group UUID is required'
    }),
  
  pin: Joi.string()
    .length(6)
    .pattern(/^\d+$/)
    .required()
    .custom((value, helpers) => {
      // Check for weak PINs
      const weakPatterns = ['012345', '123456', '654321', '111111', '000000', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999'];
      if (weakPatterns.includes(value)) {
        return helpers.error('custom.weakPin');
      }
      return value;
    })
    .messages({
      'string.length': 'PIN must be exactly 6 digits',
      'string.pattern.base': 'PIN must contain only numbers',
      'any.required': 'PIN is required',
      'custom.weakPin': 'PIN cannot be sequential or all same digits'
    })
});

// ===== VALIDATION MIDDLEWARE =====

export const validateJoi = (schema, options = {}) => {
  return async (req, res, next) => {
    try {
      const validationOptions = {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true,
        context: req.body,
        ...options
      };
      
      const validatedData = await schema.validateAsync(req.body, validationOptions);
      
      // Replace req.body with validated and sanitized data
      req.body = validatedData;
      
      next();
    } catch (error) {
      if (error.isJoi) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
      }
      
      // Pass other errors to error handler
      next(error);
    }
  };
};

// ===== QUERY PARAMETER VALIDATION =====

export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  
  sort: Joi.string()
    .valid('createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'splitTitle', '-splitTitle')
    .default('-createdAt')
});

export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const validatedQuery = await schema.validateAsync(req.query, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });
      
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error.isJoi) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: errors
        });
      }
      
      next(error);
    }
  };
};
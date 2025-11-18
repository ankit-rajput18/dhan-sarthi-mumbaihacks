const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  ageGroup: {
    type: String,
    enum: ['student', 'young-professional', 'experienced'],
    required: [true, 'Age group is required']
  },
  income: {
    type: Number,
    default: 0
  },
  
  // Onboarding and Profile Data
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  profile: {
    age: {
      type: Number,
      min: 18,
      max: 100
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say']
    },
    profession: {
      type: String,
      enum: ['student', 'salaried', 'freelancer', 'business', 'other']
    },
    city: {
      type: String
    },
    cityType: {
      type: String,
      enum: ['metro', 'non-metro']
    },
    monthlyIncome: {
      type: Number,
      default: 0
    },
    annualIncome: {
      type: Number,
      default: 0
    }
  },
  
  // Tax Profile Data
  taxProfile: {
    taxRegime: {
      type: String,
      enum: ['old', 'new'],
      default: 'new'
    },
    
    // Rent Details
    payingRent: {
      type: Boolean,
      default: false
    },
    monthlyRent: {
      type: Number,
      default: 0
    },
    
    // Health Insurance
    hasHealthInsurance: {
      type: Boolean,
      default: false
    },
    healthInsurancePremium: {
      type: Number,
      default: 0
    },
    parentsHealthInsurance: {
      type: Number,
      default: 0
    },
    
    // Home Loan
    hasHomeLoan: {
      type: Boolean,
      default: false
    },
    homeLoanEMI: {
      type: Number,
      default: 0
    },
    homeLoanInterest: {
      type: Number,
      default: 0
    },
    
    // Section 80C Investments
    investments80C: {
      ppf: { type: Number, default: 0 },
      elss: { type: Number, default: 0 },
      lifeInsurance: { type: Number, default: 0 },
      epf: { type: Number, default: 0 },
      nps: { type: Number, default: 0 }
    },
    
    // Other Deductions
    hasEducationLoan: {
      type: Boolean,
      default: false
    },
    educationLoanInterest: {
      type: Number,
      default: 0
    },
    
    lastUpdated: {
      type: Date
    }
  },
  
  preferences: {
    currency: {
      type: String,
      default: 'INR'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);

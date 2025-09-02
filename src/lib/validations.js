export const expenseSchema = {
  amount: {
    required: 'Amount is required',
    min: { value: 0.01, message: 'Amount must be positive' },
    max: { value: 1000000, message: 'Amount cannot exceed ₹10 lakh' }
  },
  category: {
    required: 'Category is required'
  },
  vendor: {
    required: 'Vendor/Merchant name is required',
    minLength: { value: 2, message: 'Vendor name must be at least 2 characters' },
    maxLength: { value: 100, message: 'Vendor name cannot exceed 100 characters' }
  },
  date: {
    required: 'Date is required',
    validate: (value) => {
      const today = new Date()
      const selectedDate = new Date(value)
      return selectedDate <= today || 'Date cannot be in the future'
    }
  },
  description: {
    maxLength: { value: 200, message: 'Description cannot exceed 200 characters' }
  }
}

// Risk thresholds
export const RISK_THRESHOLDS = {
  HIGH_AMOUNT: 50000,
  MEDIUM_AMOUNT: 10000,
  MAX_DAILY_TRANSACTIONS: 10,
  DUPLICATE_CHECK_DAYS: 7
}

// Category limits (percentage of total spending)
export const CATEGORY_LIMITS = {
  Entertainment: 0.4, // 40%
  Food: 0.6,          // 60%
  Travel: 0.5,        // 50%
  Other: 0.3          // 30%
}

// Expense categories with emojis
export const EXPENSE_CATEGORIES = [
  { value: 'Food', label: '🍽️ Food & Dining', emoji: '🍽️' },
  { value: 'Travel', label: '✈️ Travel', emoji: '✈️' },
  { value: 'Entertainment', label: '🎬 Entertainment', emoji: '🎬' },
  { value: 'Office', label: '🏢 Office Supplies', emoji: '🏢' },
  { value: 'Healthcare', label: '🏥 Healthcare', emoji: '🏥' },
  { value: 'Education', label: '📚 Education', emoji: '📚' },
  { value: 'Shopping', label: '🛍️ Shopping', emoji: '🛍️' },
  { value: 'Utilities', label: '⚡ Utilities', emoji: '⚡' },
  { value: 'Other', label: '📦 Other', emoji: '📦' }
]

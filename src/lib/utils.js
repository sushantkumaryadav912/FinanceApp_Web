import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Format currency for Indian Rupees
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

// Calculate days ago with better formatting
export function daysAgo(date) {
  const diffTime = new Date() - new Date(date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays} days ago`
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

// Group expenses by category with enhanced data
export function groupByCategory(expenses) {
  return expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other'
    if (!acc[category]) {
      acc[category] = {
        total: 0,
        count: 0,
        expenses: [],
        avgAmount: 0,
        riskScore: 0,
        emoji: expense.category_emoji || '📦'
      }
    }
    
    const amount = parseFloat(expense.amount) || 0
    acc[category].total += amount
    acc[category].count += 1
    acc[category].expenses.push(expense)
    acc[category].avgAmount = acc[category].total / acc[category].count
    acc[category].riskScore += (expense.risk_adjusted_amount || amount) * 0.1
    
    return acc
  }, {})
}

// Calculate monthly totals with trends
export function getMonthlyTotals(expenses) {
  const monthlyData = expenses.reduce((acc, expense) => {
    const monthKey = new Date(expense.date).toISOString().substring(0, 7)
    if (!acc[monthKey]) {
      acc[monthKey] = {
        total: 0,
        count: 0,
        avgAmount: 0,
        riskScore: 0
      }
    }
    
    const amount = parseFloat(expense.amount) || 0
    acc[monthKey].total += amount
    acc[monthKey].count += 1
    acc[monthKey].avgAmount = acc[monthKey].total / acc[monthKey].count
    acc[monthKey].riskScore += (expense.risk_adjusted_amount || amount) * 0.1
    
    return acc
  }, {})

  return Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-IN', { 
        month: 'short', 
        year: 'numeric' 
      }),
      monthKey: month,
      ...data
    }))
}

// Enhanced risk detection with scoring
export function detectRisks(expenses, complianceRules = []) {
  const risks = []
  
  // High amount detection
  expenses.forEach(expense => {
    const amount = parseFloat(expense.amount)
    if (amount > 100000) {
      risks.push({
        id: `high-${expense.id}`,
        type: 'HIGH_AMOUNT',
        expense,
        message: `Critical: Very high amount transaction`,
        severity: 'critical',
        riskScore: 95,
        recommendation: 'Immediate approval required'
      })
    } else if (amount > 50000) {
      risks.push({
        id: `medium-${expense.id}`,
        type: 'HIGH_AMOUNT',
        expense,
        message: `High amount transaction requires review`,
        severity: 'high',
        riskScore: 75,
        recommendation: 'Manager approval recommended'
      })
    }
  })

  // Duplicate detection with enhanced logic
  expenses.forEach((expense, index) => {
    const duplicates = expenses.filter((other, otherIndex) => 
      otherIndex !== index &&
      Math.abs(parseFloat(other.amount) - parseFloat(expense.amount)) < 0.01 &&
      other.category === expense.category &&
      Math.abs(new Date(other.date) - new Date(expense.date)) <= 3 * 24 * 60 * 60 * 1000 // 3 days
    )
    
    if (duplicates.length > 0) {
      risks.push({
        id: `dup-${expense.id}`,
        type: 'DUPLICATE',
        expense,
        message: `Potential duplicate: ${duplicates.length} similar transaction(s)`,
        severity: 'medium',
        riskScore: 60,
        recommendation: 'Verify transaction authenticity'
      })
    }
  })

  // Weekend business expense detection
  expenses.forEach(expense => {
    const expenseDate = new Date(expense.date)
    const isWeekend = expenseDate.getDay() === 0 || expenseDate.getDay() === 6
    
    if (isWeekend && ['Office', 'Travel'].includes(expense.category)) {
      risks.push({
        id: `weekend-${expense.id}`,
        type: 'SUSPICIOUS_PATTERN',
        expense,
        message: 'Business expense on weekend',
        severity: 'low',
        riskScore: 30,
        recommendation: 'Verify business necessity'
      })
    }
  })

  // Missing critical information
  expenses.forEach(expense => {
    let missingFields = []
    if (!expense.description || expense.description.trim() === '') {
      missingFields.push('description')
    }
    if (!expense.vendor) missingFields.push('vendor')
    if (parseFloat(expense.amount) > 5000 && !expense.receipt_url) {
      missingFields.push('receipt')
    }
    
    if (missingFields.length > 0) {
      risks.push({
        id: `missing-${expense.id}`,
        type: 'MISSING_FIELD',
        expense,
        message: `Missing: ${missingFields.join(', ')}`,
        severity: missingFields.includes('receipt') ? 'medium' : 'low',
        riskScore: missingFields.length * 15,
        recommendation: 'Complete required information'
      })
    }
  })

  return risks.sort((a, b) => b.riskScore - a.riskScore)
}

// Calculate spending anomalies using statistical analysis
export function detectSpendingAnomalies(expenses) {
  if (expenses.length < 5) return []

  const amounts = expenses.map(exp => parseFloat(exp.amount))
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length
  const stdDev = Math.sqrt(variance)
  
  const threshold = mean + (2.5 * stdDev) // 2.5 standard deviations
  
  return expenses.filter(expense => parseFloat(expense.amount) > threshold)
    .map(expense => ({
      id: `anomaly-${expense.id}`,
      type: 'SPENDING_ANOMALY',
      expense,
      message: `Unusual spending: ${((parseFloat(expense.amount) - mean) / stdDev).toFixed(1)}σ above average`,
      severity: parseFloat(expense.amount) > mean + (3 * stdDev) ? 'high' : 'medium',
      riskScore: Math.min(90, ((parseFloat(expense.amount) - mean) / stdDev) * 20),
      recommendation: 'Verify expense legitimacy'
    }))
}

// Calculate category spending against limits
export function calculateCategoryLimits(expenses, categories) {
  const currentMonth = new Date().toISOString().substring(0, 7)
  const monthlyExpenses = expenses.filter(exp => exp.date.startsWith(currentMonth))
  
  const categorySpending = groupByCategory(monthlyExpenses)
  
  return categories.map(category => {
    const spent = categorySpending[category.name]?.total || 0
    const limit = category.monthly_limit
    const percentage = limit ? (spent / limit) * 100 : 0
    
    return {
      ...category,
      spent,
      limit,
      percentage,
      remaining: limit ? Math.max(0, limit - spent) : null,
      isOverLimit: limit ? spent > limit : false,
      riskLevel: !limit ? 'none' : 
                percentage > 100 ? 'critical' :
                percentage > 80 ? 'high' :
                percentage > 60 ? 'medium' : 'low'
    }
  })
}

// Generate compliance score
export function calculateComplianceScore(expenses, risks, rules) {
  if (expenses.length === 0) return 100
  
  const totalExpenses = expenses.length
  const highRiskCount = risks.filter(r => r.severity === 'critical' || r.severity === 'high').length
  const mediumRiskCount = risks.filter(r => r.severity === 'medium').length
  
  // Base score
  let score = 100
  
  // Deduct for risks
  score -= (highRiskCount * 15) // High risk: -15 points each
  score -= (mediumRiskCount * 8) // Medium risk: -8 points each
  score -= (risks.length * 2) // Any risk: -2 points each
  
  // Bonus for good practices
  const hasDescriptions = expenses.filter(e => e.description && e.description.trim()).length
  const descriptionBonus = (hasDescriptions / totalExpenses) * 10
  score += descriptionBonus
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

// Export expense data to CSV
export function exportToCSV(expenses, filename = 'expenses') {
  if (expenses.length === 0) return null
  
  const headers = [
    'Date', 'Category', 'Description', 'Amount', 'Vendor', 
    'Payment Method', 'Status', 'Created At'
  ]
  
  const rows = expenses.map(expense => [
    expense.date,
    expense.category,
    expense.description || '',
    expense.amount,
    expense.vendor || '',
    expense.payment_method || '',
    expense.status || '',
    new Date(expense.created_at).toLocaleString('en-IN')
  ])
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Validate expense data
export function validateExpenseData(data, categories = []) {
  const errors = {}
  
  if (!data.amount || parseFloat(data.amount) <= 0) {
    errors.amount = 'Amount must be greater than 0'
  }
  
  if (!data.category) {
    errors.category = 'Category is required'
  }
  
  if (!data.date) {
    errors.date = 'Date is required'
  } else if (new Date(data.date) > new Date()) {
    errors.date = 'Date cannot be in the future'
  }
  
  if (data.description && data.description.length > 500) {
    errors.description = 'Description cannot exceed 500 characters'
  }
  
  // Check category limits
  const category = categories.find(c => c.name === data.category)
  if (category?.monthly_limit && parseFloat(data.amount) > category.monthly_limit) {
    errors.amount = `Amount exceeds monthly limit of ${formatCurrency(category.monthly_limit)}`
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

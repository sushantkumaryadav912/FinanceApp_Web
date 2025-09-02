'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { Trash2, AlertTriangle, Search, Filter } from 'lucide-react'
import { EXPENSE_CATEGORIES } from '../../lib/validations'
import { formatCurrency, daysAgo } from '../../lib/utils'

export default function ExpenseList({ refreshTrigger, onExpenseDeleted }) {
  const [expenses, setExpenses] = useState([])
  const [filteredExpenses, setFilteredExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date', 'amount', 'category'
  const [sortOrder, setSortOrder] = useState('desc') // 'asc', 'desc'

  const fetchExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [refreshTrigger])

  // Filter and sort expenses
  useEffect(() => {
    let filtered = expenses.filter(expense => {
      const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === '' || expense.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })

    // Sort expenses
    filtered.sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'amount':
          aValue = parseFloat(a.amount)
          bValue = parseFloat(b.amount)
          break
        case 'category':
          aValue = a.category.toLowerCase()
          bValue = b.category.toLowerCase()
          break
        case 'date':
        default:
          aValue = new Date(a.date)
          bValue = new Date(b.date)
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredExpenses(filtered)
  }, [expenses, searchTerm, selectedCategory, sortBy, sortOrder])

  const deleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    setDeletingId(id) // Show loading state
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      // Update local state immediately for better UX
      setExpenses(prev => prev.filter(exp => exp.id !== id))
      
      // Notify parent component to refresh data
      if (onExpenseDeleted) {
        onExpenseDeleted(id)
      }
      
      console.log('Expense deleted successfully')
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Failed to delete expense. Please try again.')
    } finally {
      setDeletingId(null) // Clear loading state
    }
  }

  const getCategoryData = (category) => {
    return EXPENSE_CATEGORIES.find(cat => cat.value === category) || 
           { emoji: '📦', label: category }
  }

  const getAmountColor = (amount) => {
    if (amount > 50000) return 'text-red-600 font-bold'
    if (amount > 10000) return 'text-amber-600 font-semibold'
    return 'text-slate-900'
  }

  const getRiskLevel = (expense) => {
    const amount = parseFloat(expense.amount)
    if (amount > 50000) return { level: 'high', color: 'text-red-500', message: 'High Risk - Large Amount' }
    if (!expense.vendor || expense.vendor.trim() === '') {
      return { level: 'medium', color: 'text-amber-500', message: 'Missing Vendor Information' }
    }
    if (!expense.description || expense.description.trim() === '') {
      return { level: 'low', color: 'text-yellow-500', message: 'Missing Description' }
    }
    return null
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <div className="animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 bg-slate-200 rounded w-1/4"></div>
            <div className="h-10 bg-slate-200 rounded w-1/3"></div>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Recent Expenses ({filteredExpenses.length}/{expenses.length})
        </h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by description, category, or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white shadow-sm hover:border-slate-400 hover:shadow-md text-slate-900 placeholder:text-slate-400"
            />
          </div>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white shadow-sm hover:border-slate-400 hover:shadow-md text-slate-900"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          
          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              setSortBy(field)
              setSortOrder(order)
            }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white shadow-sm hover:border-slate-400 hover:shadow-md text-slate-900"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="category-asc">Category A-Z</option>
          </select>
        </div>
      </div>
      
      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          {expenses.length === 0 ? (
            <>
              <div className="text-6xl mb-4">💰</div>
              <p className="text-lg mb-2 font-medium">No expenses yet</p>
              <p className="text-sm">Add your first expense to get started!</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg mb-2 font-medium">No matching expenses</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredExpenses.map((expense) => {
            const categoryData = getCategoryData(expense.category)
            const risk = getRiskLevel(expense)
            
            return (
              <div key={expense.id} 
                   className={`flex items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-all duration-200 ${
                     risk?.level === 'high' ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white'
                   }`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <span className="text-xl">{categoryData.emoji}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{expense.category}</span>
                      {risk && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className={`h-4 w-4 ${risk.color}`} />
                          <span className={`text-xs font-medium ${risk.color}`} title={risk.message}>
                            {risk.level.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {expense.vendor && (
                      <p className="text-sm text-emerald-700 font-medium mb-1">
                        {expense.vendor}
                      </p>
                    )}
                    <p className="text-sm text-slate-600 mb-1 font-medium">
                      {expense.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                      <span>•</span>
                      <span>{daysAgo(expense.date)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold ${getAmountColor(parseFloat(expense.amount))}`}>
                    {formatCurrency(expense.amount)}
                  </span>
                  
                  <button 
                    onClick={() => deleteExpense(expense.id)}
                    disabled={deletingId === expense.id}
                    className={`p-2 rounded-lg transition-all duration-200 hover:shadow-sm ${
                      deletingId === expense.id 
                        ? 'text-slate-400 bg-slate-100 cursor-not-allowed' 
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                    title="Delete expense"
                  >
                    {deletingId === expense.id ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

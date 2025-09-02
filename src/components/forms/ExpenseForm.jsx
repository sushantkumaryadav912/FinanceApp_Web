'use client'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../../lib/supabase'
import { PlusCircle, AlertCircle, Calendar } from 'lucide-react'
import { expenseSchema, EXPENSE_CATEGORIES } from '../../lib/validations'

export default function ExpenseForm({ onExpenseAdded }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0] // Today's date
    }
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const onSubmit = async (data) => {
    setLoading(true)
    setMessage('')
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Please log in to add expenses')
      }

      const { data: expense, error } = await supabase
        .from('expenses')
        .insert([
          {
            user_id: user.id,
            amount: parseFloat(data.amount),
            category: data.category,
            vendor: data.vendor,
            description: data.description || null,
            date: data.date
          }
        ])
        .select()

      if (error) throw error

      setMessage('✅ Expense added successfully!')
      reset({
        amount: '',
        category: '',
        vendor: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
      
      if (onExpenseAdded) onExpenseAdded(expense[0])
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(''), 3000)
      
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <PlusCircle className="h-5 w-5 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Add New Expense</h2>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Amount Field */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">
            Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('amount', expenseSchema.amount)}
            type="number" 
            step="0.01"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-900 placeholder:text-slate-400 ${
              errors.amount ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white shadow-sm hover:border-slate-400 hover:shadow-md'
            }`}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
              <AlertCircle className="h-4 w-4" />
              {errors.amount.message}
            </p>
          )}
        </div>
        
        {/* Category Field */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">
            Category <span className="text-red-500">*</span>
          </label>
          <select 
            {...register('category', expenseSchema.category)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-900 ${
              errors.category ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white shadow-sm hover:border-slate-400 hover:shadow-md'
            }`}
          >
            <option value="">Select category</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
              <AlertCircle className="h-4 w-4" />
              {errors.category.message}
            </p>
          )}
        </div>
        
        {/* Vendor Field */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">
            Vendor/Merchant <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('vendor', expenseSchema.vendor)}
            type="text" 
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-900 placeholder:text-slate-400 ${
              errors.vendor ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white shadow-sm hover:border-slate-400 hover:shadow-md'
            }`}
            placeholder="e.g., Amazon, Swiggy, Uber, etc."
          />
          {errors.vendor && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
              <AlertCircle className="h-4 w-4" />
              {errors.vendor.message}
            </p>
          )}
        </div>
        
        {/* Description Field */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">Description</label>
          <input 
            {...register('description', expenseSchema.description)}
            type="text" 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white shadow-sm hover:border-slate-400 hover:shadow-md text-slate-900 placeholder:text-slate-400"
            placeholder="Brief description of the expense (optional)"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
              <AlertCircle className="h-4 w-4" />
              {errors.description.message}
            </p>
          )}
        </div>
        
        {/* Date Field */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">
            Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input 
              {...register('date', expenseSchema.date)}
              type="date" 
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-slate-900 ${
                errors.date ? 'border-red-300 bg-red-50' : 'border-slate-300 bg-white shadow-sm hover:border-slate-400 hover:shadow-md'
              }`}
              max={new Date().toISOString().split('T')[0]}
            />
            <Calendar className="absolute right-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
          </div>
          {errors.date && (
            <p className="text-red-500 text-sm mt-2 flex items-center gap-1 font-medium">
              <AlertCircle className="h-4 w-4" />
              {errors.date.message}
            </p>
          )}
        </div>
        
        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Adding Expense...
            </>
          ) : (
            <>
              <PlusCircle className="h-4 w-4" />
              Add Expense
            </>
          )}
        </button>
        
        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg border ${
            message.includes('✅') 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              {message.includes('✅') ? (
                <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {message}
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

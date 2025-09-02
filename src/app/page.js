'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import AuthForm from '../components/auth/AuthForm'
import ExpenseForm from '../components/forms/ExpenseForm'
import ExpenseList from '../components/expenses/ExpenseList'
import ExpenseChart from '../components/charts/ExpenseChart'
import StatsCards from '../components/ui/StatsCard'
import { LogOut, DollarSign, Download, FileText, AlertCircle } from 'lucide-react'
import { detectRisks, detectSpendingAnomalies, formatCurrency } from '../lib/utils'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expenses, setExpenses] = useState([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [risks, setRisks] = useState([])

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fetch expenses when user is available
  useEffect(() => {
    if (user) {
      fetchExpenses()
    }
  }, [user, refreshTrigger])

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExpenses(data || [])

      // Calculate risks
      const detectedRisks = detectRisks(data || [])
      const anomalies = detectSpendingAnomalies(data || [])
      setRisks([...detectedRisks, ...anomalies])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setExpenses([])
    setRisks([])
  }

  const handleExpenseAdded = (newExpense) => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleExpenseDeleted = (deletedExpenseId) => {
    // Trigger a refresh to update all components
    setRefreshTrigger(prev => prev + 1)
  }

  const exportToCSV = () => {
    if (expenses.length === 0) {
      alert('No expenses to export')
      return
    }

    const csvContent = [
      ['Date', 'Category', 'Description', 'Amount'],
      ...expenses.map(exp => [
        exp.date,
        exp.category,
        exp.description || '',
        exp.amount
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Finance Dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-800 bg-clip-text text-transparent">Finance Dashboard</h1>
                <p className="text-xl text-slate-600 font-medium">Risk & Compliance Management</p>
              </div>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <p className="text-lg text-slate-700 mb-8 leading-relaxed">
                Track your expenses, detect risks, and maintain financial compliance with 
                our comprehensive analytics platform designed for modern financial management.
              </p>
            </div>
          </div>
          
          <AuthForm />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg shadow-md">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-emerald-800 bg-clip-text text-transparent">Finance Dashboard</h1>
                <p className="text-sm text-slate-600 font-medium">Risk & Compliance Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={exportToCSV}
                disabled={expenses.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export expenses to CSV"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Export</span>
              </button>
              
              <div className="h-4 w-px bg-slate-300"></div>
              
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">
                  {user.email}
                </p>
                <p className="text-xs text-slate-500">
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''} tracked
                </p>
              </div>
              
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <StatsCards />

        {/* Risk Alerts */}
        {risks.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1 bg-red-100 rounded-full">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-red-800">Risk Alerts ({risks.length})</h3>
            </div>
            
            <div className="space-y-3">
              {risks.slice(0, 3).map((risk, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-red-100 shadow-sm">
                  <div className={`p-1.5 rounded-full ${
                    risk.severity === 'high' ? 'bg-red-100 text-red-600' :
                    risk.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">{risk.message}</p>
                      <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                        {formatCurrency(risk.expense.amount)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {risk.expense.category} • {risk.expense.date}
                    </p>
                  </div>
                </div>
              ))}
              
              {risks.length > 3 && (
                <p className="text-sm text-red-600 text-center py-3 font-medium">
                  +{risks.length - 3} more alert{risks.length - 3 !== 1 ? 's' : ''} found
                </p>
              )}
            </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <ExpenseForm onExpenseAdded={handleExpenseAdded} />
          </div>
          <div className="lg:col-span-2">
            <ExpenseList refreshTrigger={refreshTrigger} onExpenseDeleted={handleExpenseDeleted} />
          </div>
        </div>

        {/* Analytics Section */}
        <div className="space-y-8">
          <ExpenseChart expenses={expenses} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-slate-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-600">
            <p className="text-sm font-medium">
              Finance Risk & Compliance Dashboard • Built with Next.js, Supabase & Tailwind CSS
            </p>
            <p className="text-xs mt-2 text-slate-500">
              Designed for financial compliance and risk management
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}

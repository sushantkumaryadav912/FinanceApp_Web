'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { DollarSign, TrendingUp, AlertCircle, Calendar, Target, CreditCard } from 'lucide-react'
import { formatCurrency, detectRisks, detectSpendingAnomalies } from '../../lib/utils'

export default function StatsCards() {
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    lastMonth: 0,
    riskFlags: 0,
    transactionCount: 0,
    avgTransaction: 0,
    topCategory: null,
    monthlyGrowth: 0
  })
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all expenses for the user
      const { data: expenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      if (expenses.length === 0) {
        setLoading(false)
        return
      }

      // Calculate basic stats
      const total = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
      const avgTransaction = total / expenses.length

      // Calculate monthly stats
      const currentDate = new Date()
      const currentMonth = currentDate.toISOString().substring(0, 7) // YYYY-MM
      const lastMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      const lastMonth = lastMonthDate.toISOString().substring(0, 7)

      const thisMonthExpenses = expenses.filter(exp => exp.date.startsWith(currentMonth))
      const lastMonthExpenses = expenses.filter(exp => exp.date.startsWith(lastMonth))

      const thisMonthTotal = thisMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)
      const lastMonthTotal = lastMonthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)

      // Calculate growth percentage
      const monthlyGrowth = lastMonthTotal > 0 
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 
        : 0

      // Find top category
      const categoryTotals = {}
      expenses.forEach(exp => {
        if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0
        categoryTotals[exp.category] += parseFloat(exp.amount)
      })
      
      const topCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0]

      // Calculate risk flags
      const riskTransactions = detectRisks(expenses)
      const anomalies = detectSpendingAnomalies(expenses)
      const totalRiskFlags = riskTransactions.length + anomalies.length

      setStats({
        total,
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        riskFlags: totalRiskFlags,
        transactionCount: expenses.length,
        avgTransaction,
        topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
        monthlyGrowth
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, isLoading }) => (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg ${
              color === 'text-emerald-600' ? 'bg-emerald-100' :
              color === 'text-blue-600' ? 'bg-blue-100' :
              color === 'text-red-600' ? 'bg-red-100' :
              color === 'text-green-600' ? 'bg-green-100' :
              color === 'text-purple-600' ? 'bg-purple-100' :
              'bg-slate-100'
            }`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-sm font-semibold text-slate-700">{title}</p>
          </div>
          
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-8 bg-slate-200 rounded w-20 animate-pulse"></div>
              {subtitle && <div className="h-4 bg-slate-200 rounded w-16 animate-pulse"></div>}
            </div>
          ) : (
            <>
              <p className={`text-2xl font-bold ${color} mb-1`}>{value}</p>
              {subtitle && (
                <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
              )}
            </>
          )}
        </div>
        
        {trend && !isLoading && (
          <div className={`text-right ${
            trend > 0 ? 'text-red-600' : trend < 0 ? 'text-emerald-600' : 'text-slate-600'
          }`}>
            <div className="flex items-center gap-1 text-sm font-semibold">
              <TrendingUp className={`h-4 w-4 ${
                trend < 0 ? 'rotate-180' : ''
              }`} />
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">vs last month</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Expenses"
        value={formatCurrency(stats.total)}
        icon={DollarSign}
        color="text-emerald-600"
        isLoading={loading}
      />
      
      <StatCard
        title="This Month"
        value={formatCurrency(stats.thisMonth)}
        subtitle={`${stats.transactionCount} transactions`}
        icon={Calendar}
        color="text-blue-600"
        trend={stats.monthlyGrowth}
        isLoading={loading}
      />
      
      <StatCard
        title="Risk Alerts"
        value={stats.riskFlags}
        subtitle={stats.riskFlags > 0 ? 'Requires attention' : 'All clear'}
        icon={AlertCircle}
        color={stats.riskFlags > 0 ? "text-red-600" : "text-emerald-600"}
        isLoading={loading}
      />
      
      <StatCard
        title="Average/Transaction"
        value={formatCurrency(stats.avgTransaction)}
        subtitle={stats.topCategory ? `Top: ${stats.topCategory.name}` : 'No data'}
        icon={Target}
        color="text-purple-600"
        isLoading={loading}
      />
    </div>
  )
}

'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts'
import { groupByCategory, getMonthlyTotals, formatCurrency } from '../../lib/utils'
import { useState } from 'react'
import { PieChart as PieIcon, TrendingUp, BarChart3 } from 'lucide-react'

const COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500  
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
  '#a855f7'  // purple-500
]

export default function ExpenseChart({ expenses }) {
  const [activeChart, setActiveChart] = useState('category')

  if (!expenses || expenses.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Expense Analytics</h3>
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No data to display</p>
            <p className="text-sm text-slate-400">Add some expenses to see analytics</p>
          </div>
        </div>
      </div>
    )
  }

  const categoryData = groupByCategory(expenses)
  const pieChartData = Object.entries(categoryData).map(([category, data]) => ({
    name: category,
    value: data.total,
    count: data.count,
    percentage: ((data.total / expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0)) * 100).toFixed(1)
  })).sort((a, b) => b.value - a.value)

  const monthlyData = getMonthlyTotals(expenses)

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-900">{data.name || label}</p>
          <p className="text-emerald-600 font-bold">
            {formatCurrency(data.value || data.total)}
          </p>
          {data.count && (
            <p className="text-slate-600 text-sm">{data.count} transactions</p>
          )}
          {data.percentage && (
            <p className="text-slate-600 text-sm">{data.percentage}% of total</p>
          )}
        </div>
      )
    }
    return null
  }

  const chartTabs = [
    { id: 'category', name: 'By Category', icon: PieIcon },
    { id: 'trend', name: 'Monthly Trend', icon: TrendingUp },
    { id: 'comparison', name: 'Category Bars', icon: BarChart3 }
  ]

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-semibold mb-4 sm:mb-0 text-slate-900">Expense Analytics</h3>
        
        <div className="flex bg-slate-100 rounded-lg p-1">
          {chartTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveChart(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeChart === tab.id
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Chart Content */}
      <div className="h-80">
        {activeChart === 'category' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'trend' && monthlyData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#2563eb', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'comparison' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pieChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'trend' && monthlyData.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Not enough data for trends</p>
              <p className="text-sm">Add expenses across multiple months</p>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {pieChartData.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0))}
              </p>
              <p className="text-sm text-gray-600">Total Spent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
              <p className="text-sm text-gray-600">Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{Object.keys(categoryData).length}</p>
              <p className="text-sm text-gray-600">Categories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0) / expenses.length)}
              </p>
              <p className="text-sm text-gray-600">Avg per Transaction</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

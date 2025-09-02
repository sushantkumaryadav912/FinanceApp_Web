'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../../lib/supabase'
import { DollarSign, Shield, BarChart3 } from 'lucide-react'

export default function AuthForm() {
  return (
    <div className="max-w-md mx-auto">
      {/* Feature highlights */}
      <div className="mb-8 text-center">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-600 font-medium">Track Expenses</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-sm text-slate-600 font-medium">Risk Management</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-sm text-slate-600 font-medium">Analytics</p>
          </div>
        </div>
      </div>

      {/* Auth form */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            style: {
              button: {
                background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
                color: 'white',
                borderRadius: '0.75rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                border: 'none',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              },
              input: {
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                backgroundColor: 'white',
                color: '#1e293b',
                transition: 'all 0.2s',
              },
              label: {
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#334155',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem',
              }
            }
          }}
          theme="light"
          providers={[]}
          redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/` : undefined}
          showLinks={true}
          view="sign_in"
        />
      </div>

      <div className="mt-4 text-center text-xs text-gray-500">
        By signing in, you agree to our terms of service and privacy policy
      </div>
    </div>
  )
}

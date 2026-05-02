import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../library/api'

export default function Login() {
  const nav = useNavigate()
  const [tab, setTab]       = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [form, setForm]     = useState({ email:'', password:'', full_name:'', phone:'' })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        const data = await api.login(form.email, form.password)
        localStorage.setItem('haulgo_token',   data.access_token)
        localStorage.setItem('haulgo_profile', JSON.stringify(data.profile))
        nav(data.profile?.role === 'admin' ? '/admin' : '/')
      } else {
        await api.register({ email: form.email, password: form.password, full_name: form.full_name, phone: form.phone })
        setTab('login')
        setError('')
        alert('Account created! Please check your email to verify, then login.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--deep)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'var(--white)', borderRadius:20, padding:'2.5rem', width:380, boxShadow:'var(--shadow-lg)' }}>

        {}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'2.2rem', fontWeight:700, letterSpacing:-1, color:'var(--deep)' }}>
            Haul<span style={{ color:'var(--moss)' }}>Go</span>
          </div>
          <div style={{ color:'var(--muted)', fontSize:13, marginTop:4 }}>Cargo booking made simple</div>
        </div>

        {}
        <div style={{ display:'flex', background:'var(--cream)', borderRadius:8, padding:4, marginBottom:'1.5rem' }}>
          {['login','signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              flex:1, padding:'8px', border:'none', fontFamily:'DM Sans,sans-serif',
              fontSize:13, fontWeight:500, borderRadius:6, cursor:'pointer', transition:'all .2s',
              background: tab===t ? 'var(--white)' : 'transparent',
              color: tab===t ? 'var(--deep)' : 'var(--muted)',
              boxShadow: tab===t ? '0 2px 8px rgba(0,0,0,.08)' : 'none'
            }}>
              {t === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background:'#fff0f0', border:'1px solid #ffcccc', borderRadius:8, padding:'10px 14px', color:'#c0392b', fontSize:13, marginBottom:'1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          {tab === 'signup' && (
            <>
              <Field label="Full Name"    type="text"  value={form.full_name} onChange={set('full_name')} placeholder="Rahul Sharma" required />
              <Field label="Phone"        type="tel"   value={form.phone}     onChange={set('phone')}     placeholder="+91 98765 43210" />
            </>
          )}
          <Field label="Email"    type="email"    value={form.email}    onChange={set('email')}    placeholder="you@example.com" required />
          <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters"  required />

          <button type="submit" disabled={loading} style={{
            width:'100%', padding:13, background: loading ? 'var(--sage)' : 'var(--moss)',
            color:'var(--white)', border:'none', borderRadius:8,
            fontFamily:'DM Sans,sans-serif', fontSize:15, fontWeight:700,
            cursor: loading ? 'not-allowed' : 'pointer', marginTop:8, transition:'all .2s'
          }}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        <div style={{ textAlign:'center', color:'var(--muted)', fontSize:12, marginTop:'1.2rem' }}>
          {tab === 'login'
            ? <>No account? <span style={{ color:'var(--moss)', cursor:'pointer', fontWeight:600 }} onClick={() => setTab('signup')}>Sign up free</span></>
            : <>Have an account? <span style={{ color:'var(--moss)', cursor:'pointer', fontWeight:600 }} onClick={() => setTab('login')}>Sign in</span></>
          }
        </div>
      </div>
    </div>
  )
}

function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>
        {label}
      </label>
      <input {...props} style={{
        width:'100%', padding:'11px 13px', border:'1.5px solid var(--border)',
        borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:14,
        color:'var(--deep)', background:'var(--cream)', outline:'none',
        transition:'border-color .2s'
      }}
        onFocus={e => e.target.style.borderColor = 'var(--moss)'}
        onBlur={e  => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}

import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const s = {
  nav: { background:'var(--deep)', padding:'0 1.5rem', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 },
  logo: { color:'var(--lime)', fontWeight:700, fontSize:'1.1rem', letterSpacing:-0.5 },
  logoSpan: { color:'var(--sage)', fontWeight:300 },
  tabs: { display:'flex', gap:4 },
  avatar: { width:32, height:32, borderRadius:'50%', background:'var(--moss)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--lime)', fontWeight:700, fontSize:12, cursor:'pointer' },
  main: { flex:1, overflow:'hidden', display:'flex', flexDirection:'column' },
}

function NavTab({ to, children }) {
  return (
    <NavLink to={to} style={({ isActive }) => ({
      padding:'6px 14px', borderRadius:20, border:'none',
      fontFamily:'DM Sans,sans-serif', fontSize:13, fontWeight:500, cursor:'pointer',
      background: isActive ? 'var(--moss)' : 'transparent',
      color: isActive ? 'var(--lime)' : 'var(--sage)',
      textDecoration: 'none', transition:'all .2s'
    })}>
      {children}
    </NavLink>
  )
}

export default function Layout() {
  const nav      = useNavigate()
  const profile  = JSON.parse(localStorage.getItem('haulgo_profile') || '{}') || {}
  const initials = (profile.full_name || 'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

  function logout() {
    localStorage.removeItem('haulgo_token')
    localStorage.removeItem('haulgo_profile')
    nav('/login')
  }

  return (
    <>
      <nav style={s.nav}>
        <div style={s.logo}>Haul<span style={s.logoSpan}>Go</span></div>
        <div style={s.tabs}>
          <NavTab to="/">📦 Book</NavTab>
          <NavTab to="/track">📍 Track</NavTab>
          {profile.role === 'admin' && <NavTab to="/admin">🛠 Admin</NavTab>}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ color:'var(--sage)', fontSize:13 }}>{profile.full_name || 'User'}</span>
          <div style={s.avatar} onClick={logout} title="Logout">{initials}</div>
        </div>
      </nav>
      <main style={s.main}><Outlet /></main>
    </>
  )
}

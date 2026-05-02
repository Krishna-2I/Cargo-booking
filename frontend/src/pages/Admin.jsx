import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../library/api'

const NAVITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'orders', icon: '📦', label: 'All Orders' },
  { id: 'customers', icon: '👥', label: 'Customers' },
  { id: 'drivers', icon: '🚛', label: 'Drivers' },
  { id: 'revenue', icon: '💰', label: 'Revenue' },
]

const STATUS_OPTIONS = ['pending', 'driver_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled']

export default function Admin() {
  const nav = useNavigate()
  const profile = JSON.parse(localStorage.getItem('haulgo_profile') || '{}')
  const [active, setActive] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [customers, setCustomers] = useState([])
  const [drivers, setDrivers] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(null)

  // Redirect non-admins
  useEffect(() => { if (profile.role !== 'admin') nav('/') }, [])

  useEffect(() => { loadSection(active) }, [active, filter])

  async function loadSection(sec) {
    setLoading(true)
    try {
      if (sec === 'dashboard') {
        const d = await api.dashboard()
        setStats(d.stats)
      } else if (sec === 'orders') {
        const params = filter !== 'all' ? { status: filter } : {}
        if (search) params.search = search
        const d = await api.adminOrders(params)
        setOrders(d.orders || [])
      } else if (sec === 'customers') {
        const d = await api.adminCustomers()
        setCustomers(d.customers || [])
      } else if (sec === 'drivers') {
        const d = await api.adminDrivers()
        setDrivers(d.drivers || [])
      }
    } catch (err) {
      console.error(err.message)
    } finally { setLoading(false) }
  }

  async function updateStatus(orderId, status) {
    setUpdating(orderId)
    try {
      await api.updateStatus(orderId, { status })
      loadSection('orders')
    } catch (err) { alert('Failed: ' + err.message) }
    finally { setUpdating(null) }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {}
      <div style={{ width: 200, background: 'var(--deep)', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem 1.2rem .5rem', color: 'var(--sage)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</div>
        {NAVITEMS.map(item => (
          <div key={item.id} onClick={() => setActive(item.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '11px 1.2rem',
            color: active === item.id ? 'var(--lime)' : 'var(--sage)',
            background: active === item.id ? 'rgba(212,222,149,.15)' : 'transparent',
            borderRight: active === item.id ? '3px solid var(--lime)' : '3px solid transparent',
            fontSize: 13, cursor: 'pointer', transition: 'all .2s'
          }}>
            <span>{item.icon}</span> {item.label}
          </div>
        ))}
      </div>

      {}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--cream)' }}>

        {}
        {active === 'dashboard' && (
          <>
            <PageHeader title="Dashboard" sub={new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} />
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: '1.5rem' }}>
                <StatCard label="Total Orders" value={stats.totalOrders || 0} sub="All time" />
                <StatCard label="Active" value={stats.activeOrders || 0} sub="In progress" color="var(--moss)" />
                <StatCard label="Revenue" value={`₹${((stats.totalRevenue || 0) / 100000).toFixed(1)}L`} sub="Delivered orders" />
                <StatCard label="Drivers Online" value={stats.activeDrivers || 0} sub="Available now" />
              </div>
            )}
            <div style={{ background: 'var(--white)', borderRadius: 12, border: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 14 }}>Click <b style={{ color: 'var(--deep)' }}>All Orders</b> in the sidebar to manage orders</div>
            </div>
          </>
        )}

        {}
        {active === 'orders' && (
          <>
            <PageHeader title="All Orders" />
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
              {}
              <input value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadSection('orders')}
                placeholder="Search order # or customer…"
                style={{ padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'var(--deep)', background: 'var(--white)', outline: 'none', flex: 1, minWidth: 200 }}
              />
              {}
              {['all', ...STATUS_OPTIONS].map(s => (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: '6px 12px', border: '1.5px solid', borderRadius: 20,
                  fontFamily: 'DM Sans,sans-serif', fontSize: 11, cursor: 'pointer', transition: 'all .2s',
                  borderColor: filter === s ? 'var(--moss)' : 'var(--border)',
                  background: filter === s ? '#e8edd8' : 'var(--white)',
                  color: filter === s ? 'var(--moss)' : 'var(--muted)',
                  fontWeight: filter === s ? 700 : 400
                }}>
                  {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </button>
              ))}
            </div>

            <div style={{ background: 'var(--white)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
              ) : orders.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>No orders found</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--cream)' }}>
                        {['Order ID', 'Customer', 'From', 'To', 'Vehicle', 'Fare', 'Status', 'Action'].map(h => (
                          <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.id} style={{ borderBottom: '1px solid #f0f2e8' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafbf5'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <td style={{ padding: '10px 14px', fontFamily: 'DM Mono,monospace', fontSize: 11, color: 'var(--moss)' }}>{o.order_number}</td>
                          <td style={{ padding: '10px 14px', fontSize: 12 }}>{o.customer_name || '—'}</td>
                          <td style={{ padding: '10px 14px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.pickup_address}</td>
                          <td style={{ padding: '10px 14px', fontSize: 12, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.drop_address}</td>
                          <td style={{ padding: '10px 14px', fontSize: 12 }}>{o.vehicle_name || '—'}</td>
                          <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600 }}>₹{(o.estimated_fare || 0).toLocaleString('en-IN')}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <StatusPill status={o.status} />
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <select
                              disabled={updating === o.id}
                              defaultValue=""
                              onChange={e => { if (e.target.value) updateStatus(o.id, e.target.value); e.target.value = '' }}
                              style={{ padding: '5px 8px', border: '1.5px solid var(--border)', borderRadius: 6, fontFamily: 'DM Sans,sans-serif', fontSize: 11, color: 'var(--deep)', background: 'var(--white)', cursor: 'pointer' }}
                            >
                              <option value="" disabled>Update…</option>
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CUSTOMERS ── */}
        {active === 'customers' && (
          <>
            <PageHeader title="Customers" />
            <SimpleTable
              loading={loading}
              headers={['Name', 'Phone', 'Role', 'Joined']}
              rows={customers.map(c => [
                c.full_name, c.phone || '—', c.role,
                new Date(c.created_at).toLocaleDateString('en-IN')
              ])}
              empty="No customers yet"
            />
          </>
        )}

        {}
        {active === 'drivers' && (
          <>
            <PageHeader title="Drivers" />
            <SimpleTable
              loading={loading}
              headers={['Name', 'Phone', 'Vehicle Type', 'Reg No', 'Rating', 'Available']}
              rows={drivers.map(d => [
                d.full_name, d.phone || '—',
                d.driver_details?.vehicle_type || '—',
                d.driver_details?.vehicle_reg || '—',
                d.driver_details?.rating || '—',
                d.driver_details?.is_available ? '✅ Yes' : '❌ No'
              ])}
              empty="No drivers yet"
            />
          </>
        )}

        {}
        {active === 'revenue' && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
            <div>Revenue analytics coming soon.<br />Use the Orders section to see fare data.</div>
          </div>
        )}
      </div>
    </div>
  )
}

function PageHeader({ title, sub }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--deep)' }}>{title}</h2>
      {sub && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{sub}</span>}
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: '1.7rem', fontWeight: 700, color: color || 'var(--deep)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--moss)', marginTop: 3 }}>{sub}</div>
    </div>
  )
}

function StatusPill({ status }) {
  const cfg = {
    pending: { bg: '#fff8e8', color: '#b8860b' },
    driver_assigned: { bg: '#e8f0fe', color: '#1a73e8' },
    picked_up: { bg: '#e8edd8', color: 'var(--moss)' },
    in_transit: { bg: '#e8edd8', color: 'var(--moss)' },
    delivered: { bg: '#e8f5e9', color: '#2e7d32' },
    cancelled: { bg: '#fff0f0', color: '#c0392b' },
  }
  const c = cfg[status] || cfg.pending
  return (
    <span style={{ ...c, padding: '4px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  )
}

function SimpleTable({ loading, headers, rows, empty }) {
  return (
    <div style={{ background: 'var(--white)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>{empty}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--cream)' }}>
                {headers.map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, borderBottom: '1px solid var(--border)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f2e8' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafbf5'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '10px 14px', fontSize: 12, color: 'var(--deep)' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

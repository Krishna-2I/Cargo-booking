import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../library/api'

const STEPS = ['pending', 'driver_assigned', 'picked_up', 'in_transit', 'delivered']
const STEP_LABELS = ['Order Placed', 'Driver Assigned', 'Picked Up', 'In Transit', 'Delivered']

function makeIcon(L, color, emoji) {
  return L.divIcon({
    className: '',
    html: `<div style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:14px;">${emoji}</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15]
  })
}

export default function Track() {
  const location = useLocation()
  const mapRef = useRef(null)
  const leafletRef = useRef(null)
  const truckRef = useRef(null)
  const intervalRef = useRef(null)

  const [orderNum, setOrderNum] = useState(location.state?.orderNumber || '')
  const [input, setInput] = useState(location.state?.orderNumber || '')
  const [order, setOrder] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function search(num) {
    const n = (num || input).trim().toUpperCase()
    if (!n) return
    setLoading(true); setError('')
    try {
      const data = await api.track(n)
      setOrder(data.order)
      setTimeline(data.timeline)
      setOrderNum(n)
    } catch (err) {
      setError('Order not found. Check your order number.')
      setOrder(null)
    } finally { setLoading(false) }
  }

  // Auto-search if came from booking
  useEffect(() => { if (location.state?.orderNumber) search(location.state.orderNumber) }, [])

  // Init map once order loaded
  useEffect(() => {
    if (!order) return
    import('leaflet').then(L => {
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null }
      if (intervalRef.current) clearInterval(intervalRef.current)

      const pickup = [order.pickup_lat || 30.9062, order.pickup_lng || 75.8412]
      const drop = [order.drop_lat || 30.8958, order.drop_lng || 75.8890]

      const map = L.map(mapRef.current).setView(pickup, 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19
      }).addTo(map)

      L.marker(pickup, { icon: makeIcon(L, '#636B2F', '📍') }).addTo(map).bindPopup('<b>Pickup</b><br>' + order.pickup_address)
      L.marker(drop, { icon: makeIcon(L, '#e74c3c', '📦') }).addTo(map).bindPopup('<b>Drop</b><br>' + order.drop_address)

      
      const pts = []
      for (let i = 0; i <= 10; i++) {
        pts.push([
          pickup[0] + (drop[0] - pickup[0]) * (i / 10),
          pickup[1] + (drop[1] - pickup[1]) * (i / 10)
        ])
      }
      L.polyline(pts, { color: '#636B2F', weight: 4, dashArray: '8 5', opacity: .85 }).addTo(map)

      
      let idx = 0
      const statusIdx = STEPS.indexOf(order.status)
      const startFrac = Math.min(statusIdx / (STEPS.length - 1), 0.7)
      const startIdx = Math.floor(startFrac * pts.length)
      idx = startIdx

      truckRef.current = L.marker(pts[idx], { icon: makeIcon(L, '#3D4127', '🚛') })
        .addTo(map).bindPopup('<b>' + (order.driver?.full_name || 'Driver') + '</b><br>En Route')

      if (order.status === 'in_transit' || order.status === 'picked_up') {
        intervalRef.current = setInterval(() => {
          idx = Math.min(idx + 1, pts.length - 1)
          truckRef.current.setLatLng(pts[idx])
          if (idx === pts.length - 1) clearInterval(intervalRef.current)
        }, 2500)
      }

      map.fitBounds([pickup, drop], { padding: [50, 50] })
      leafletRef.current = map
    })

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (leafletRef.current) { leafletRef.current.remove(); leafletRef.current = null }
    }
  }, [order])

  const statusIdx = order ? STEPS.indexOf(order.status) : -1

  const pillColor = {
    pending: '#fff8e8', pending_text: '#b8860b',
    in_transit: '#e8edd8', in_transit_text: 'var(--moss)',
    delivered: '#e8f5e9', delivered_text: '#2e7d32',
    cancelled: '#fff0f0', cancelled_text: '#c0392b'
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {}
      <div style={{ width: 340, background: 'var(--white)', borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem', flexShrink: 0 }}>

        {}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .7, marginBottom: 8 }}>Track Order</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="HG-2025-00142"
              style={{ flex: 1, padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'DM Mono,monospace', fontSize: 13, color: 'var(--deep)', background: 'var(--cream)', outline: 'none' }}
            />
            <button onClick={() => search()} disabled={loading} style={{
              padding: '10px 14px', background: 'var(--moss)', color: 'var(--white)', border: 'none',
              borderRadius: 8, fontFamily: 'DM Sans,sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer'
            }}>
              {loading ? '…' : 'Track'}
            </button>
          </div>
          {error && <div style={{ marginTop: 8, fontSize: 12, color: '#c0392b' }}>{error}</div>}
        </div>

        {order && <>
          {}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, fontWeight: 600, background: 'var(--lime)', color: 'var(--deep)', padding: '4px 10px', borderRadius: 20 }}>
              {order.order_number}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 20,
              background: order.status === 'delivered' ? '#e8f5e9' : order.status === 'cancelled' ? '#fff0f0' : order.status === 'pending' ? '#fff8e8' : '#e8edd8',
              color: order.status === 'delivered' ? '#2e7d32' : order.status === 'cancelled' ? '#c0392b' : order.status === 'pending' ? '#b8860b' : 'var(--moss)'
            }}>
              ● {order.status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          </div>

          {}
          <Card title="Delivery Progress">
            {timeline.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: i < timeline.length - 1 ? 16 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: step.done ? 'var(--moss)' : 'var(--white)',
                    border: `2.5px solid ${step.done ? 'var(--moss)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {step.done && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                  </div>
                  {i < timeline.length - 1 && <div style={{ width: 2, background: step.done ? 'var(--moss)' : 'var(--border)', flex: 1, minHeight: 20, marginTop: 2 }} />}
                </div>
                <div style={{ paddingTop: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: step.done ? 600 : 400, color: step.done ? 'var(--deep)' : 'var(--muted)' }}>
                    {STEP_LABELS[STEPS.indexOf(step.status)]}
                  </div>
                  {step.done && order.status_history?.find(h => h.status === step.status) && (
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {new Date(order.status_history.find(h => h.status === step.status).created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Card>

          {}
          {order.driver && (
            <Card title="Driver">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--deep)', color: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                  {order.driver.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{order.driver.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{order.driver_details?.vehicle_reg || 'Vehicle assigned'}</div>
                  <div style={{ fontSize: 11, color: '#f0a500' }}>★★★★★ {order.driver_details?.rating || '5.0'}</div>
                </div>
                <a href={`tel:${order.driver.phone}`} style={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid var(--border)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: 14 }}>📞</a>
              </div>
            </Card>
          )}

          {}
          <Card title="Order Details">
            <InfoRow label="From" value={order.pickup_address} />
            <InfoRow label="To" value={order.drop_address} />
            <InfoRow label="Vehicle" value={order.vehicle?.name} />
            <InfoRow label="Distance" value={order.distance_km ? `${order.distance_km} km` : '—'} />
            <InfoRow label="Fare" value={`₹${(order.estimated_fare || 0).toLocaleString('en-IN')}`} big />
          </Card>
        </>}

        {!order && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, padding: '2rem 0' }}>
            Enter your order number above to track your cargo
          </div>
        )}
      </div>

      {}
      <div ref={mapRef} style={{ flex: 1 }}>
        {!order && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--muted)' }}>
            <div style={{ fontSize: 48 }}>🗺️</div>
            <div style={{ fontSize: 14 }}>Track your order to see it on the map</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: '.8rem' }}>{title}</div>
      {children}
    </div>
  )
}

function InfoRow({ label, value, big }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: big ? 'var(--moss)' : 'var(--deep)', fontSize: big ? 15 : 12 }}>{value || '—'}</span>
    </div>
  )
}

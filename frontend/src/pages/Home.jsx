import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../library/api'

const LUDHIANA = [30.9010, 75.8573]

const VEHICLES = [
  { type:'bike',          icon:'🛵', name:'Bike',         cap:'Up to 20 kg',     base: 450 },
  { type:'mini_truck',    icon:'🚐', name:'Mini Truck',   cap:'Up to 500 kg',    base: 850 },
  { type:'large_truck',   icon:'🚛', name:'Large Truck',  cap:'Up to 5,000 kg',  base: 1600 },
  { type:'heavy_freight', icon:'🏗️', name:'Heavy Freight',cap:'Up to 20,000 kg', base: 3200 },
]

const CARGO = [
  { icon:'📦', label:'General' },
  { icon:'🔩', label:'Industrial' },
  { icon:'🥶', label:'Cold Chain' },
  { icon:'⚗️', label:'Hazardous' },
  { icon:'🛋️', label:'Furniture' },
  { icon:'🌾', label:'Agriculture' },
]

function makeIcon(L, color, emoji) {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:15px;">${emoji}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16]
  })
}

function haversine(a, b) {
  const R = 6371, dLat = (b[0]-a[0])*Math.PI/180, dLon = (b[1]-a[1])*Math.PI/180
  const h = Math.sin(dLat/2)**2 + Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h))
}

export default function Home() {
  const nav          = useNavigate()
  const mapRef       = useRef(null)
  const leafletRef   = useRef(null)
  const pickupMRef   = useRef(null)
  const dropMRef     = useRef(null)
  const routeLineRef = useRef(null)
  const clickState   = useRef('pickup')

  const [pickup,     setPickup]     = useState({ latlng: [30.9062, 75.8412], address: 'Sarabha Nagar, Ludhiana' })
  const [drop,       setDrop]       = useState({ latlng: [30.8958, 75.8890], address: 'Focal Point, Ludhiana' })
  const [vehicle,    setVehicle]    = useState(VEHICLES[0])
  const [cargo,      setCargo]      = useState(0)
  const [fare,       setFare]       = useState({ price: 450, dist: '6.2', eta: 22 })
  const [booking,    setBooking]    = useState(false)
  const [vehicles,   setVehicles]   = useState([])

  
  useEffect(() => {
    api.vehicles().then(d => { if (d.vehicles?.length) setVehicles(d.vehicles) }).catch(() => {})
  }, [])

  
  useEffect(() => {
    if (leafletRef.current) return
    import('leaflet').then(L => {
      const map = L.map(mapRef.current, { zoomControl: true }).setView(LUDHIANA, 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map)

      pickupMRef.current = L.marker(pickup.latlng, { icon: makeIcon(L, '#636B2F', '📍'), draggable: true })
        .addTo(map).bindPopup('<b>Pickup</b>')
      dropMRef.current   = L.marker(drop.latlng,   { icon: makeIcon(L, '#e74c3c', '📦'), draggable: true })
        .addTo(map).bindPopup('<b>Drop</b>')

      drawRoute(L, map, pickup.latlng, drop.latlng)
      leafletRef.current = { map, L }

      
      pickupMRef.current.on('dragend', e => {
        const ll = [e.target.getLatLng().lat, e.target.getLatLng().lng]
        revGeo(ll, 'pickup')
        redraw(ll, [dropMRef.current.getLatLng().lat, dropMRef.current.getLatLng().lng])
      })
      dropMRef.current.on('dragend', e => {
        const ll = [e.target.getLatLng().lat, e.target.getLatLng().lng]
        revGeo(ll, 'drop')
        redraw([pickupMRef.current.getLatLng().lat, pickupMRef.current.getLatLng().lng], ll)
      })

      
      map.on('click', e => {
        const ll = [e.latlng.lat, e.latlng.lng]
        if (clickState.current === 'pickup') {
          pickupMRef.current.setLatLng(e.latlng)
          revGeo(ll, 'pickup')
          clickState.current = 'drop'
        } else {
          dropMRef.current.setLatLng(e.latlng)
          revGeo(ll, 'drop')
          clickState.current = 'pickup'
        }
        redraw(
          [pickupMRef.current.getLatLng().lat, pickupMRef.current.getLatLng().lng],
          [dropMRef.current.getLatLng().lat,   dropMRef.current.getLatLng().lng]
        )
      })

      map.fitBounds([pickup.latlng, drop.latlng], { padding: [60, 60] })
    })

    return () => {
      if (leafletRef.current) { leafletRef.current.map.remove(); leafletRef.current = null }
    }
  }, [])

  function drawRoute(L, map, from, to) {
    if (routeLineRef.current) map.removeLayer(routeLineRef.current)
    routeLineRef.current = L.polyline([from, to], {
      color: '#636B2F', weight: 4, dashArray: '8 5', opacity: 0.85
    }).addTo(map)
  }

  function redraw(from, to) {
    if (!leafletRef.current) return
    const { L, map } = leafletRef.current
    drawRoute(L, map, from, to)
    const dist = haversine(from, to)
    const km   = Math.round(dist * 10) / 10
    const eta  = Math.round(km * 3.5)
    const price= Math.round(vehicle.base * 0.6 + km * (vehicle.base / 10))
    setFare({ price, dist: km, eta })
  }

  async function revGeo(ll, which) {
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${ll[0]}&lon=${ll[1]}&format=json`, { headers:{'User-Agent':'HaulGo/1.0'} })
      const data = await res.json()
      const a    = data.address
      const addr = [a.road || a.suburb || a.neighbourhood, a.city || a.town || 'Ludhiana'].filter(Boolean).join(', ')
      if (which === 'pickup') setPickup(p => ({ ...p, address: addr, latlng: ll }))
      else                    setDrop(p   => ({ ...p, address: addr, latlng: ll }))
    } catch (_) {}
  }

  async function forwardGeo(addr, which) {
    if (!addr.trim()) return
    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`, { headers:{'User-Agent':'HaulGo/1.0'} })
      const data = await res.json()
      if (data && data.length > 0) {
        const ll = [parseFloat(data[0].lat), parseFloat(data[0].lon)]
        if (which === 'pickup') {
          setPickup(p => ({ ...p, latlng: ll }))
          if (pickupMRef.current) pickupMRef.current.setLatLng(ll)
          redraw(ll, drop.latlng)
        } else {
          setDrop(p => ({ ...p, latlng: ll }))
          if (dropMRef.current) dropMRef.current.setLatLng(ll)
          redraw(pickup.latlng, ll)
        }
        if (leafletRef.current) {
           leafletRef.current.map.fitBounds([which === 'pickup' ? ll : pickup.latlng, which === 'drop' ? ll : drop.latlng], { padding: [60, 60] })
        }
      } else {
        alert('Address not found. Please try again or click on the map.')
      }
    } catch (_) {
      alert('Error searching for address.')
    }
  }

  async function book() {
    setBooking(true)
    try {
      const dbVehicle = vehicles.find(v => v.type === vehicle.type)
      const body = {
        vehicle_id:      dbVehicle?.id || null,
        vehicle_type:    vehicle.type,
        pickup_address:  pickup.address,
        pickup_lat:      pickup.latlng[0],
        pickup_lng:      pickup.latlng[1],
        drop_address:    drop.address,
        drop_lat:        drop.latlng[0],
        drop_lng:        drop.latlng[1],
        distance_km:     fare.dist,
      }
      const data = await api.createOrder(body)
      alert(`✅ Booked!\nOrder: ${data.order?.order_number}\nFare: ₹${fare.price}\n\nTracking your order now.`)
      nav('/track', { state: { orderNumber: data.order?.order_number } })
    } catch (err) {
      alert('Booking failed: ' + err.message)
    } finally {
      setBooking(false)
    }
  }

  return (
    <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
      {}
      <div style={{ width:360, background:'var(--white)', borderRight:'1px solid var(--border)', overflowY:'auto', padding:'1.2rem', display:'flex', flexDirection:'column', gap:'.9rem', flexShrink:0 }}>

        <SectionLabel>Route</SectionLabel>
        <div>
          <LocInput 
            icon="🟢" value={pickup.address} 
            onChange={e => setPickup(p => ({ ...p, address: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && forwardGeo(pickup.address, 'pickup')}
            placeholder="Type pickup & press Enter" active={clickState.current==='pickup'} 
          />
          <div style={{ width:1.5, height:14, background:'var(--border)', marginLeft:17 }}/>
          <LocInput 
            icon="🔴" value={drop.address} 
            onChange={e => setDrop(p => ({ ...p, address: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && forwardGeo(drop.address, 'drop')}
            placeholder="Type drop & press Enter" active={clickState.current==='drop'} 
          />
        </div>
        <div style={{ fontSize:11, color:'var(--muted)', background:'#f0f3e8', padding:'7px 10px', borderRadius:6 }}>
          💡 Type address & press Enter · Or click map
        </div>

        <SectionLabel>Cargo Type</SectionLabel>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7 }}>
          {CARGO.map((c,i) => (
            <div key={i} onClick={() => setCargo(i)} style={{
              border: `1.5px solid ${cargo===i ? 'var(--moss)' : 'var(--border)'}`,
              background: cargo===i ? '#e8edd8' : 'var(--cream)',
              borderRadius:8, padding:'10px 6px', textAlign:'center', cursor:'pointer', transition:'all .2s'
            }}>
              <div style={{ fontSize:20, marginBottom:3 }}>{c.icon}</div>
              <div style={{ fontSize:10, fontWeight:600, color:'var(--muted)' }}>{c.label}</div>
            </div>
          ))}
        </div>

        <SectionLabel>Vehicle</SectionLabel>
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          {VEHICLES.map(v => (
            <div key={v.type} onClick={() => { setVehicle(v); redraw(pickup.latlng, drop.latlng) }} style={{
              display:'flex', alignItems:'center', gap:10, padding:10,
              border: `1.5px solid ${vehicle.type===v.type ? 'var(--moss)' : 'var(--border)'}`,
              background: vehicle.type===v.type ? '#e8edd8' : 'var(--cream)',
              borderRadius:8, cursor:'pointer', transition:'all .2s'
            }}>
              <div style={{ width:36, height:36, borderRadius:7, background:'var(--lime)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{v.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'var(--deep)' }}>{v.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>{v.cap}</div>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--moss)' }}>₹{v.base}</div>
            </div>
          ))}
        </div>

        {}
        <div style={{ background:'var(--cream)', border:'1.5px solid var(--border)', borderRadius:8, padding:'10px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:11, color:'var(--muted)' }}>Distance: {fare.dist} km</div>
            <div style={{ fontSize:'1.3rem', fontWeight:700, color:'var(--deep)' }}>₹{fare.price.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:11, color:'var(--muted)' }}>Est. time</div>
            <div style={{ fontSize:13, fontWeight:600 }}>~{fare.eta} min</div>
          </div>
        </div>

        <button onClick={book} disabled={booking} style={{
          background: booking ? 'var(--sage)' : 'var(--moss)', color:'var(--white)',
          border:'none', borderRadius:8, padding:13, fontFamily:'DM Sans,sans-serif',
          fontSize:15, fontWeight:700, cursor: booking ? 'not-allowed' : 'pointer', transition:'all .2s'
        }}>
          {booking ? 'Confirming…' : `Book Now — ₹${fare.price.toLocaleString('en-IN')}`}
        </button>
      </div>

      {}
      <div ref={mapRef} style={{ flex:1 }} />
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:.7 }}>{children}</div>
}

function LocInput({ icon, value, placeholder, onChange, onKeyDown, active }) {
  return (
    <div style={{ position:'relative' }}>
      <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:10 }}>{icon}</span>
      <input value={value} placeholder={placeholder} onChange={onChange} onKeyDown={onKeyDown} style={{
        width:'100%', padding:'11px 12px 11px 30px', border:`1.5px solid ${active ? 'var(--moss)' : 'var(--border)'}`,
        borderRadius:8, fontFamily:'DM Sans,sans-serif', fontSize:13, boxSizing: 'border-box',
        color:'var(--deep)', background:'var(--cream)', outline:'none', transition: 'border .2s'
      }}/>
    </div>
  )
}

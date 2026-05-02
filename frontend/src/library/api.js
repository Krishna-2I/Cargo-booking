const BASE = '/api'

function headers() {
  const token = localStorage.getItem('haulgo_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {})
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  
  login:    (email, password)    => req('POST', '/auth/login',    { email, password }),
  register: (body)               => req('POST', '/auth/register', body),
  me:       ()                   => req('GET',  '/auth/me'),

  
  vehicles:   ()  => req('GET', '/vehicles'),
  cargoTypes: ()  => req('GET', '/vehicles/cargo-types'),

  
  myOrders:   ()  => req('GET',  '/orders'),
  getOrder:   id  => req('GET',  `/orders/${id}`),
  createOrder: b  => req('POST', '/orders', b),
  cancelOrder:(id,reason) => req('PATCH', `/orders/${id}/cancel`, { reason }),
  estimate:   b   => req('POST', '/orders/estimate', b),

  
  route: (body)   => req('POST', '/maps/route', body),

  
  track: (num)    => req('GET',  `/track/${num}`),

  
  dashboard:    ()    => req('GET',  '/admin/dashboard'),
  adminOrders:  (p)   => req('GET',  '/admin/orders?' + new URLSearchParams(p)),
  adminOrder:   id    => req('GET',  `/admin/orders/${id}`),
  updateStatus: (id,b)=> req('PATCH',`/admin/orders/${id}/status`, b),
  adminDrivers: ()    => req('GET',  '/admin/drivers'),
  adminCustomers:()   => req('GET',  '/admin/customers'),
}

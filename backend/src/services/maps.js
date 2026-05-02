const fetch = require('node-fetch');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const OSRM_URL      = 'https://router.project-osrm.org';
const USER_AGENT    = 'HaulGo-CargoApp/1.0';

async function fetchJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}


async function geocode(address) {
  const q    = encodeURIComponent(address + ', India');
  const data = await fetchJSON(`${NOMINATIM_URL}/search?q=${q}&format=json&limit=1&countrycodes=in`);
  if (!data.length) throw new Error(`Cannot geocode: ${address}`);
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), displayName: data[0].display_name };
}


async function reverseGeocode(lat, lng) {
  const data = await fetchJSON(`${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json`);
  const a    = data.address;
  return [a.road || a.suburb || a.neighbourhood, a.city || a.town || a.village || 'Ludhiana']
    .filter(Boolean).join(', ');
}


async function getRoute(fromLat, fromLng, toLat, toLng) {
  const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
  const data   = await fetchJSON(`${OSRM_URL}/route/v1/driving/${coords}?overview=simplified`);
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('Route not found');
  const r = data.routes[0];
  return {
    distanceKm:  Math.round((r.distance / 1000) * 10) / 10,
    durationMin: Math.round(r.duration / 60),
    geometry:    r.geometry
  };
}

const RATES = {
  bike:          { base: 80,  perKm: 18  },
  mini_truck:    { base: 200, perKm: 45  },
  large_truck:   { base: 400, perKm: 80  },
  heavy_freight: { base: 800, perKm: 140 }
};

function calculateFare(vehicleType, distanceKm) {
  const rate = RATES[vehicleType] || RATES.mini_truck;
  return Math.round(rate.base + rate.perKm * distanceKm);
}

module.exports = { geocode, reverseGeocode, getRoute, calculateFare };

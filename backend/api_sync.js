import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import fetch from 'node-fetch';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

/**
 * World Bank API Helper
 * Fetches the latest available value for a given indicator and country code.
 */
async function fetchWorldBankIndicator(countryCode, indicatorCode) {
  // World Bank API provides data by country code (e.g. 'AR' or 'ARG')
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorCode}?format=json&per_page=1`;
  const response = await fetch(url);
  const data = await response.json();
  if (data && data[1] && data[1].length > 0) {
    const record = data[1][0];
    return {
      value: record.value,
      date: record.date
    };
  }
  return { value: null, date: null };
}

/**
 * Real API Integrations Registry mapping to the 55 Layers DB
 */
const API_REGISTRY = {
  // --- 🌍 CLIMATE ---

  // 8. Кліматичні зони та сезонність (Open-Meteo)
  "climate_temperature": async (lat, lon) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      source: "Open-Meteo API",
      value: data.current_weather.temperature,
      unit: "C",
      timestamp: data.current_weather.time
    };
  },

  // 7. Якість повітря (OpenAQ)
  "air_quality_aqi": async (lat, lon) => {
    const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lon}&radius=10000`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await response.json();
    let aqi = null;
    if (data.results && data.results.length > 0) {
      const pm25 = data.results[0].measurements.find(m => m.parameter === 'pm25');
      if (pm25) aqi = pm25.value;
    }
    return {
      source: "OpenAQ",
      value: aqi,
      unit: "µg/m³ PM2.5",
      timestamp: new Date().toISOString()
    };
  },

  // 9. Ризик землетрусів (USGS) - M4.5+ over the last 30 days within 500km
  "climate_earthquakes_30d": async (lat, lon) => {
    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const startDate = d30.toISOString().split('T')[0];
    const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=500&minmagnitude=4.5&starttime=${startDate}`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      source: "USGS FDSNWS API",
      value: data.metadata ? data.metadata.count : 0,
      unit: "Seismic Events (M > 4.5)",
      timestamp: new Date().toISOString()
    };
  },

  // --- ⚡ INFRASTRUCTURE ---

  // 14. Громадський транспорт (OpenStreetMap Overpass API) - Count bus stops within 2km
  "infrastructure_transit": async (lat, lon) => {
    const query = `[out:json];node["highway"="bus_stop"](around:2000,${lat},${lon});out count;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      source: "OpenStreetMap (Overpass)",
      value: data.elements && data.elements.length > 0 ? data.elements[0].tags.nodes : 0,
      unit: "Bus Stops (within 2km radius)",
      timestamp: new Date().toISOString()
    };
  },

  // 📝 Real Estate Amenities - Count cafes and restaurants within 1km
  "amenity_dining": async (lat, lon) => {
    const query = `[out:json];(node["amenity"="restaurant"](around:1000,${lat},${lon});node["amenity"="cafe"](around:1000,${lat},${lon}););out count;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      source: "OpenStreetMap (Overpass API)",
      value: data.elements && data.elements.length > 0 ? data.elements[0].tags.nodes : 0,
      unit: "Cafes/Restaurants (within 1km radius)",
      timestamp: new Date().toISOString()
    };
  },

  "amenity_hospital": async (lat, lon) => {
    const query = `[out:json];node["amenity"="hospital"](around:2000,${lat},${lon});out count;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      source: "OpenStreetMap",
      value: data.elements && data.elements.length > 0 ? data.elements[0].tags.nodes : 0,
      unit: "Hospitals (within 2km radius)",
      timestamp: new Date().toISOString()
    };
  },

  "shop_supermarket": async (lat, lon) => {
    const query = `[out:json];node["shop"="supermarket"](around:1000,${lat},${lon});out count;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      source: "OpenStreetMap",
      value: data.elements && data.elements.length > 0 ? data.elements[0].tags.nodes : 0,
      unit: "Supermarkets (within 1km radius)",
      timestamp: new Date().toISOString()
    };
  },

  "leisure_park": async (lat, lon) => {
    const query = `[out:json];(node["leisure"="park"](around:1000,${lat},${lon});way["leisure"="park"](around:1000,${lat},${lon}););out count;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return {
      source: "OpenStreetMap",
      value: data.elements && data.elements.length > 0 ? (data.elements[0].tags.nodes + (data.elements[0].tags.ways || 0)) : 0,
      unit: "Parks (within 1km radius)",
      timestamp: new Date().toISOString()
    };
  },

  // --- 💰 ECONOMY & 🛡 SAFETY (Via World Bank API) ---

  // 20. Купівельна спроможність (PPP - GDP per Capita - NY.GDP.PCAP.PP.CD)
  "economy_ppp": async (lat, lon, countryCode) => {
    if (!countryCode) throw new Error("countryCode is required for World Bank API");
    const indicator = await fetchWorldBankIndicator(countryCode, 'NY.GDP.PCAP.PP.CD');
    return {
      source: "World Bank API",
      value: indicator.value,
      unit: "USD (PPP)",
      timestamp: indicator.date
    };
  },

  // 29. Легкість ведення бізнесу (Ease of doing business rank - IC.BUS.EASE.XQ)
  "business_ease": async (lat, lon, countryCode) => {
    if (!countryCode) throw new Error("countryCode is required for World Bank API");
    const indicator = await fetchWorldBankIndicator(countryCode, 'IC.BUS.EASE.XQ');
    return {
      source: "World Bank API",
      value: indicator.value,
      unit: "Rank (1 = Most Business-Friendly)",
      timestamp: indicator.date
    };
  },

  // 3. Корупція CPI (CPIA transparency - IQ.CPA.TRAN.XQ)
  "safety_corruption": async (lat, lon, countryCode) => {
    if (!countryCode) throw new Error("countryCode is required for World Bank API");
    const indicator = await fetchWorldBankIndicator(countryCode, 'IQ.CPA.TRAN.XQ');
    return {
      source: "World Bank API (CPIA Ratings)",
      value: indicator.value,
      unit: "Rating (1 = Low to 6 = High)",
      timestamp: indicator.date
    };
  }

};

/**
 * Main Sync Function
 * @param {string} locationId - Database ID of the location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} countryCode - ISO Alpha-2 Country Code (e.g. 'AR' for Argentina)
 */
export async function syncLocationLayers(locationId, lat, lon, countryCode) {
  console.log(`Starting massive real API sync for ${locationId} (${lat}, ${lon}, Country: ${countryCode})`);
  const updates = {};
  
  const tasks = Object.keys(API_REGISTRY).map(async (key) => {
    try {
      const result = await API_REGISTRY[key](lat, lon, countryCode);
      console.log(`[SYNC SUCCESS] ${key} ->`, result);
      updates[key] = result;
    } catch (e) {
      console.error(`[SYNC FAILED] ${key}:`, e.message);
    }
  });

  await Promise.all(tasks);

  // Write to Firebase map_layers collection
  try {
    const docRef = doc(db, 'synced_layers', locationId);
    await setDoc(docRef, {
      ...updates,
      last_synced: new Date().toISOString()
    }, { merge: true });
    console.log(`[DB WRITE SUCCESS] Firebase -> synced_layers/${locationId}`);
  } catch(e) {
    if (e.message && e.message.includes("NOT_FOUND")) {
      console.error("[DB WRITE ERROR] Firestore initialization failed/Database missing. But API fetches succeeded locally!");
    } else {
      console.error("[DB WRITE ERROR] Firebase write failed:", e.message);
    }
  }
}

// ----------------------------------------------------
// Test Run from CLI (Buenos Aires: Lat -34.6037, Lon -58.3816, Country 'AR')
if (process.argv[1] && process.argv[1].includes('api_sync.js')) {
  syncLocationLayers('buenos_aires_core', -34.6037, -58.3816, 'AR')
    .then(() => process.exit(0))
    .catch(console.error);
}

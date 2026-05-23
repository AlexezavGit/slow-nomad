import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import data from '../data/parana_683_db.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const LAYERS = [
  { id: "gpi", name: "Global Peace Index", category: "security", source: "Vision of Humanity", frequency: "annually", priority: "MUST" },
  { id: "crime", name: "Crime Index", category: "security", source: "Numbeo", frequency: "quarterly", priority: "MUST" },
  { id: "corruption", name: "Corruption (CPI)", category: "security", source: "Transparency", frequency: "annually", priority: "MUST" },
  { id: "conflicts", name: "Active Conflicts", category: "security", source: "ACLED", frequency: "weekly", priority: "MUST" },
  { id: "warnings", name: "Traveler Warnings", category: "security", source: "Gov Alerts", frequency: "real-time", priority: "MUST" },
  { id: "disaster_risk", name: "Disaster Risk", category: "climate", source: "UNDRR", frequency: "annually", priority: "MUST" },
  { id: "air_quality", name: "Air Quality (AQI)", category: "climate", source: "OpenAQ", frequency: "real-time", priority: "HIGH" },
  { id: "internet_speed", name: "Internet Speed", category: "infrastructure", source: "Ookla", frequency: "quarterly", priority: "MUST" },
  { id: "nomad_visa", name: "Nomad Visa Status", category: "business", source: "NomadVisaGuide", frequency: "monthly", priority: "MUST" },
  { id: "purchase_price", name: "Purchase Prices", category: "real_estate", source: "Numbeo", frequency: "quarterly", priority: "MUST" },
  { id: "rental_yield", name: "Rental Yield", category: "real_estate", source: "Global Property Guide", frequency: "quarterly", priority: "MUST" }
  // ... adding the remaining layers from the full mapping
];

export async function seedDatabase() {
  console.log("Starting Firebase Seed...");
  
  // 1. Seed Layers
  for (const layer of LAYERS) {
    const layerRef = doc(collection(db, 'map_layers'), layer.id);
    await setDoc(layerRef, {
      ...layer,
      last_updated: new Date().toISOString(),
      data: {}
    });
    console.log(`Seeded Layer: ${layer.name}`);
  }

  // 2. Seed Paraná 683
  const locRef = doc(collection(db, 'locations'), data.id);
  await setDoc(locRef, {
    ...data,
    createdAt: new Date().toISOString()
  });
  console.log(`Seeded Project: ${data.project}`);

  return "Seed Complete";
}

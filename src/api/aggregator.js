import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Aggregator Engine
 * Pulls data based on locationID and userProfile (interests, journeyType).
 */
export async function getLocationData(locationId, userProfile) {
  try {
    // 1. Fetch Location Canonical Data
    const locRef = doc(db, 'locations', locationId);
    const locSnap = await getDoc(locRef);
    
    if (!locSnap.exists()) {
      throw new Error("Location not found");
    }
    const location = locSnap.data();

    // 2. Matching Logic (Taylor-made)
    // We prioritize sections based on user's journey type
    const priorityCategories = getPriorityByJourney(userProfile.journeyType);
    
    // 3. Fetch Map Layers in real-time
    const layersRef = collection(db, 'map_layers');
    const q = query(layersRef, where('category', 'in', priorityCategories));
    const layersSnap = await getDocs(q);
    const layersData = layersSnap.docs.map(doc => doc.data());

    // 4. ROI Re-calculation (Validation)
    const financials = calculateLiveROI(location.financials);

    return {
      id: locationId,
      meta: location,
      layers: layersData,
      financials: financials,
      isInvestor: userProfile.journeyType === 'passive-investor',
      radius: userProfile.radius || 1000 // default pedestrian visibility
    };
  } catch (error) {
    console.error("Aggregation Error:", error);
    return null;
  }
}

/**
 * Weights interest categories by journey type
 */
function getPriorityByJourney(type) {
  const mapping = {
    'seeker': ['society', 'infrastructure', 'climate'],
    'passive-investor': ['real_estate', 'budget', 'economics', 'security'],
    'nomad': ['infrastructure', 'leisure', 'society', 'budget'],
    'hotelier': ['economics', 'real_estate', 'infrastructure']
  };
  return mapping[type] || ['security', 'infrastructure', 'climate'];
}

/**
 * Ensures formula integrity: [Total Income / [Acq + Reno]]
 */
function calculateLiveROI(fin) {
  const totalCapex = fin.acquisition.total + fin.renovation.total;
  const totalRevenue = fin.exit.total_income_annual; // updated from model
  return {
    roi: (totalRevenue / totalCapex * 100).toFixed(2),
    capex: totalCapex,
    income: totalRevenue
  };
}

import { GoogleGenAI } from "@google/genai";
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const path = params.path ? params.path.join('/') : '';
  const method = request.method;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Helper to get Firebase DB
  const getDb = () => {
    // We assume the firebase-applet-config.json content is available in env or we hardcode the essential part
    // Since we can't easily read local JSON at runtime in Worker without bundling, 
    // we expect the config to be passed via ENV or we'll need to inject it.
    // For now, let's use the env variables.
    const firebaseConfig = JSON.parse(env.FIREBASE_CONFIG || '{}');
    const app = initializeApp(firebaseConfig);
    return getFirestore(app);
  };

  try {
    // Health check
    if (path === 'health') {
      return new Response(JSON.stringify({ status: 'OK', message: 'Cloudflare Function is running' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // AI Recommendations
    if (path === 'recommendations' && method === 'POST') {
      const { interests, journeyContext, currentCity } = await request.json();
      const ai = new GoogleGenAI(env.GEMINI_API_KEY);
      const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `You are a community building and long-term residency expert for the FreeMan Life Map platform. ${journeyContext ? `User journey context: ${journeyContext}` : ''}
Based on these interests: ${interests.join(", ")}${currentCity ? ` and current location: ${currentCity}` : ""}, suggest 3 unique locations or communities for long-term residency.
Return as a JSON array of objects with keys: name, location, reason, vibe, cost, journeyFit.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return new Response(response.text(), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Communities API (Minimal implementation for demo/dev)
    if (path === 'communities' && method === 'GET') {
      const db = getDb();
      const snapshot = await getDocs(collection(db, 'communities'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Journey Types
    if (path === 'journey-types' && method === 'GET') {
      const journeyTypes = [
        { id: 'seeker', name: 'Шукач', description: 'Знайти місце та спільноту' },
        { id: 'proposer', name: 'Пропонувальник', description: 'Мають об\'єкт/ідею' },
        { id: 'explorer', name: 'Дослідник', description: 'Першопрохідець нових місць' },
        { id: 'custodian', name: 'Кустодіан', description: 'Управляючий об\'єктом' },
        { id: 'retirement-architect', name: 'Пенсійний архітектор', description: 'Будує мережу активів' },
        { id: 'cross-booker', name: 'Крос-букер', description: 'Оптимізує переміщення' },
        { id: 'hotelier', name: 'Готельєр', description: 'Приєднує готовий об\'єкт' },
        { id: 'thematic-traveler', name: 'Тематичний мандрівник', description: 'Подорож за темою' },
        { id: 'passive-investor', name: 'Пасивний інвестор', description: 'Тільки ROI' }
      ];
      return new Response(JSON.stringify(journeyTypes), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Path /api/${path} not found or method ${method} not allowed` }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

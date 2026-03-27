import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, getDocFromServer, deleteField, collection, getDocs, query, where } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const GEMINI_MODEL = "gemini-2.0-flash";

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// AI Recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const { interests, journeyContext, currentCity } = req.body;

    const prompt = `You are a community building and long-term residency expert for the FreeMan Life Map platform. ${journeyContext ? `User journey context: ${journeyContext}` : ''}

Based on these interests: ${interests.join(", ")}${currentCity ? ` and current location: ${currentCity}` : ""}, suggest 3 unique locations or communities for long-term residency (staying 6-12 months or permanent).

Consider the user's journey type and tailor recommendations accordingly:
- For Seekers: Focus on welcoming communities and social integration
- For Explorers/Pioneers: Suggest undiscovered or emerging locations
- For Custodians: Recommend established properties needing management
- For Retirement Architects: Focus on stable, income-generating locations
- For Cross-bookers: Suggest locations within existing network for easy transitions
- For Thematic Travelers: Build routes around their specific theme
- For Passive Investors: Prioritize high-yield, low-maintenance opportunities
- For Hoteliers: Suggest locations for network expansion

For each recommendation, provide:
- Name (descriptive location name)
- City, Country
- Why it fits for long-term residency (one sentence, tailored to journey type)
- Vibe (one word)
- Estimated monthly cost (USD)
- Journey fit (how well it matches their journey type)

Return as a JSON array of objects with keys: name, location, reason, vibe, cost, journeyFit.`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const recommendations = JSON.parse(response.text || "[]");
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// Community Insights
app.post('/api/community-insights', async (req, res) => {
  try {
    const { locationName, customPrompt } = req.body;
    
    const prompt = customPrompt || `Tell me about the community and lifestyle for long-term residents in ${locationName}. Focus on community building, local integration, and long-term sustainability. Keep it concise (max 100 words).`;
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    
    res.json({ insight: response.text });
  } catch (error) {
    console.error('Error getting community insights:', error);
    res.status(500).json({ error: 'Failed to get community insights' });
  }
});

// Communities API
app.get('/api/communities', async (req, res) => {
  try {
    const communitiesRef = collection(db, 'communities');
    const snapshot = await getDocs(communitiesRef);
    const communities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(communities);
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

app.post('/api/communities', async (req, res) => {
  try {
    const communityData = req.body;
    const docRef = doc(collection(db, 'communities'));
    await setDoc(docRef, {
      ...communityData,
      createdAt: new Date(),
      id: docRef.id
    });
    res.json({ id: docRef.id, ...communityData });
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

app.get('/api/communities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, 'communities', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      res.json({ id: docSnap.id, ...docSnap.data() });
    } else {
      res.status(404).json({ error: 'Community not found' });
    }
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ error: 'Failed to fetch community' });
  }
});

// Users API with Journey Types
app.get('/api/users', async (req, res) => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    const docRef = doc(collection(db, 'users'));
    await setDoc(docRef, {
      ...userData,
      createdAt: new Date(),
      id: docRef.id
    });
    res.json({ id: docRef.id, ...userData });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = doc(db, 'users', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      res.json({ id: docSnap.id, ...docSnap.data() });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Journey Types API
app.get('/api/journey-types', (req, res) => {
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
  res.json(journeyTypes);
});

// Add more routes here as needed

// Serve static files from backend directory
app.use(express.static(path.join(process.cwd(), 'backend')));

// Serve backend.html as the root route
app.get('/', (req, res) => {
  res.sendFile('backend.html', { root: path.join(process.cwd(), 'backend') });
});

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
  console.log(`Backend dashboard available at http://localhost:${port}`);
});
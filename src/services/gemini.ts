import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const GEMINI_MODEL = "gemini-2.0-flash";

export async function getRecommendations(interests: string[], currentCity?: string) {
  const prompt = `You are a community building and long-term residency expert. Based on these interests: ${interests.join(", ")}${currentCity ? ` and current location: ${currentCity}` : ""}, suggest 3 unique locations or communities for long-term residency (staying 6-12 months or permanent). 
  For each, provide:
  - Name
  - City, Country
  - Why it fits for long-term residency (one sentence)
  - Vibe (one word)
  - Estimated monthly cost (USD)
  
  Return as a JSON array of objects with keys: name, location, reason, vibe, cost.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse recommendations", e);
    return [];
  }
}

export async function getCommunityInsights(locationName: string, customPrompt?: string) {
  const prompt = customPrompt || `Tell me about the community and lifestyle for long-term residents in ${locationName}. Focus on community building, local integration, and long-term sustainability. Keep it concise (max 100 words).`;
  
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });
  
  return response.text;
}

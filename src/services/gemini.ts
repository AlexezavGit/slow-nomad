// API base URL - adjust if backend is on different port
const API_BASE = 'http://localhost:3002/api';

export async function getRecommendations(interests: string[], journeyContext?: string, currentCity?: string) {
  try {
    const response = await fetch(`${API_BASE}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interests, journeyContext, currentCity }),
    });

    if (!response.ok) {
      throw new Error('Failed to get recommendations');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}

export async function getCommunityInsights(locationName: string, customPrompt?: string) {
  try {
    const response = await fetch(`${API_BASE}/community-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ locationName, customPrompt }),
    });

    if (!response.ok) {
      throw new Error('Failed to get community insights');
    }

    const data = await response.json();
    return data.insight;
  } catch (error) {
    console.error('Error fetching community insights:', error);
    return "I'm currently analyzing the community data. Please check back later for personalized insights.";
  }
}

export async function getAIStewardResponse(userMessage: string, locationData: any) {
  const customPrompt = `User asks: "${userMessage}". You are the AI steward of the community in ${locationData.name}, ${locationData.country}. Context: ${locationData.description}. Give a brief, helpful response.`;
  return await getCommunityInsights(locationData.name, customPrompt);
}

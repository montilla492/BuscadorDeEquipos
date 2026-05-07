// @ts-ignore
import { GoogleGenerativeAI } from "@google/genai";
import { Squad, UserProfile } from "../types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function suggestSquads(player: UserProfile, availableSquads: Squad[]) {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not configured.");
    return null;
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Actúa como un experto analista de eSports y matchmaking. 
    Jugador: ${JSON.stringify(player)}
    Squads Disponibles: ${JSON.stringify(availableSquads)}
    
    Analiza la compatibilidad del jugador con los squads basándote en:
    1. Rango (Prioriza rangos similares).
    2. Vibe (Si el jugador es 'competitive' prioriza squads 'competitive').
    3. Roles (Evita squads que ya tengan el rol principal del jugador si es un rol de 1 solo slot).
    
    Devuelve un JSON con:
    - bestSquadId (ID del mejor squad)
    - reason (Razón breve en español de por qué es el mejor)
    - compatScore (0-100)
    - insight (Un consejo pro para este jugador)
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // basic parsing - in production use structured output or cleaner regex
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("Gemini suggestion error:", error);
    return null;
  }
}

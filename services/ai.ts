import { GoogleGenAI } from "@google/genai";
import { GameState, Player } from "../types";

// Initialize Gemini Client
// Note: In a production environment, ensure API_KEY is set. 
// The app will gracefully degrade to static text if the key is missing.
const apiKey = process.env.API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generateAICommentary = async (
  batter: Player,
  bowler: Player,
  runs: number,
  isOut: boolean,
  context: string
): Promise<string | null> => {
  if (!ai) return null;

  try {
    const prompt = `
      Write a short, exciting, TV-style cricket commentary sentence (max 15 words).
      Match: India vs Pakistan.
      Batter: ${batter}. Bowler: ${bowler}.
      Event: ${isOut ? 'WICKET!' : runs + ' runs scored'}.
      Context: ${context}
      
      Examples:
      - "Glorious drive through the covers!"
      - "Edged and gone! A huge wicket for Pakistan!"
      - "Massive six! That's out of the stadium!"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text?.trim() || null;
  } catch (error) {
    console.error("Gemini Commentary Error:", error);
    return null;
  }
};

export const generateCoachTip = async (gameState: GameState): Promise<string | null> => {
  if (!ai) return null;

  try {
    const { indiaScore, pakistanScore, target, status, balls } = gameState;
    const ballsBowled = balls.length;
    const overs = Math.floor(ballsBowled / 6) + '.' + (ballsBowled % 6);
    
    let prompt = '';
    
    if (status === 'INNINGS_1') {
      prompt = `You are a cricket coach for India. Current Score: India ${indiaScore}. Overs: ${overs}.
      Give 1 short piece of advice (max 10 words) to the batter.
      Focus on: ${ballsBowled < 12 ? 'Starting steady' : 'Accelerating'}.`;
    } else if (status === 'INNINGS_2') {
      const needed = (target || 0) - pakistanScore;
      prompt = `You are a cricket coach for India (Bowling). Pakistan needs ${needed} runs to win.
      Give 1 short piece of tactical advice (max 10 words) to the bowler to defend the target.`;
    } else {
      return null;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.warn("Gemini Coach Error:", error);
    return null;
  }
};
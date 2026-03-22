
import { GoogleGenAI } from "@google/genai";
import { Document, ChatMessage } from "../types.ts";

export interface AIProviderResponse {
  text: string;
  source: string;
  status: string;
  responseTime: number;
}

export const aiService = {
  processMessage: async (messages: ChatMessage[], availableDocs: Document[]): Promise<AIProviderResponse> => {
    const startTime = Date.now();
    
    // Initialisation du client GenAI
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construction du contexte des documents pour l'IA
    const docsContext = availableDocs.map(d => `- ${d.title} [${d.categoryId}]`).join('\n');

    const systemInstruction = `Tu es Astarté, un système d'IA intelligent et polyvalent.
Tes réponses doivent être précises, utiles et accessibles.
Tu as accès aux archives suivantes sur le site :
${docsContext}

Si un utilisateur pose une question sur un sujet couvert par ces archives, mentionne qu'il peut trouver des ressources spécifiques dans les secteurs correspondants du site.
Réponds toujours en français. Sois rapide et efficace.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const responseTime = Date.now() - startTime;
      
      return {
        text: response.text || "Désolé, Astarté est actuellement saturée.",
        source: "Gemini 3 Flash (Astarté Engine)",
        status: "ACTIF",
        responseTime: responseTime
      };
    } catch (error) {
      console.error("Erreur Polaris Brain:", error);
      throw error;
    }
  }
};

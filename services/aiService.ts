
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

    const systemInstruction = `Tu es Polaris Brain, un système d'IA expert en éducation supérieure, créé par Astarté Léon.
Tes réponses doivent être précises, académiques mais accessibles, et imprégnées de l'autorité du Nexus Polaris.
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
        text: response.text || "Désolé, le Nexus est actuellement saturé.",
        source: "Gemini 3 Flash (Polaris Engine)",
        status: "ACTIF",
        responseTime: responseTime
      };
    } catch (error) {
      console.error("Erreur Polaris Brain:", error);
      throw error;
    }
  }
};

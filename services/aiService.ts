
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Document } from '../types.ts';
import { storageService } from './storageService.ts';

export interface AIProviderResponse {
  text: string;
  source: string;
}

// Service d'intelligence artificielle Polaris utilisant le SDK officiel @google/genai
export const aiService = {
  /**
   * Construit le prompt système pour Polaris Brain en intégrant les documents et les directives de l'administrateur.
   */
  getSystemPrompt: (documents: Document[]) => {
    const docsContext = documents.length > 0 
      ? documents.map(d => `- ${d.title} (ID: ${d.id})`).join('\n')
      : "Aucune archive PDF détectée.";
    
    const directives = storageService.getIADirectives();
    const notes = storageService.getIANotes();
    
    return `TU ES POLARIS BRAIN, L'ENTITÉ D'ASSISTANCE DE SUCCESSPOLARIS.
STYLE : Futuriste, Poli, Très Motivant. Spécialiste BAC 2025.
DIRECTIVES ADMIN : ${directives}
NOTES DE COURS : ${notes}

ARCHIVES PDF DISPONIBLES :
${docsContext}

PROTOCOLE :
1. Aide l'élève pour le BAC 2025.
2. Suggère TOUJOURS les PDF si pertinent.
3. Ne mentionne pas tes limites techniques.`;
  },

  /**
   * Traite le message de l'utilisateur avec le modèle Gemini.
   * Utilise gemini-3-flash-preview pour une réponse rapide et efficace.
   * Cette implémentation corrige l'erreur Promise.any en utilisant le SDK officiel.
   */
  processMessage: async (messages: ChatMessage[], documents: Document[]): Promise<AIProviderResponse> => {
    // Initialisation du client avec la clé d'API de l'environnement (process.env.API_KEY)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemInstruction = aiService.getSystemPrompt(documents);
    const start = Date.now();
    const modelName = 'gemini-3-flash-preview';

    try {
      // Transformation de l'historique des messages pour le format supporté par le SDK Google GenAI
      const contents = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Appel de l'API avec la configuration optimisée
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
          maxOutputTokens: 1000,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Le Nexus a retourné un signal vide.");
      }

      const timeTaken = Date.now() - start;
      
      // Enregistrement des statistiques de performance pour le monitoring admin
      storageService.logAIResponse(modelName, timeTaken);
      
      // Analyse et archivage du flux de conversation pour le dashboard
      storageService.logQueryForAnalysis(
        storageService.getUserEmail(),
        messages[messages.length - 1]?.text || "Requête inconnue",
        text
      );

      return { 
        text, 
        source: `Nexus ${modelName}` 
      };
    } catch (e: any) {
      // Journalisation critique en cas d'échec du service
      storageService.logAIError(modelName, e.message);
      console.error("Gemini AI Critical Error:", e);
      
      return {
        text: "Une fluctuation dans le Nexus astral empêche ma réponse. Réessayez dans un instant.",
        source: "LOG_SYSTEM_FAILURE"
      };
    }
  }
};

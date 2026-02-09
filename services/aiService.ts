
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Document } from '../types.ts';
import { storageService } from './storageService.ts';

export interface AIProviderResponse {
  text: string;
  source: string;
}

// Canal de secours (OpenRouter / StepFun) pour garantir la continuité de service
const GAMMA_BACKUP_KEY = "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";

export const aiService = {
  getSystemPrompt: (documents: Document[]) => {
    const docsContext = documents.length > 0 
      ? documents.map(d => `- ${d.title} (ID: ${d.id})`).join('\n')
      : "Aucun document n'est chargé.";
    
    const directives = storageService.getIADirectives();
    const notes = storageService.getIANotes();
    
    return `TU ES POLARIS BRAIN, L'ASSISTANT DE SUCCESSPOLARIS.
TON STYLE : Futuriste, Poli, Très Motivant.
DIRECTIVES : ${directives}
NOTES : ${notes}
ARCHIVES DISPONIBLES :
${docsContext}

PROTOCOLE :
1. Aide l'élève pour le BAC 2025.
2. Suggère TOUJOURS de consulter les PDF si pertinent.
3. Ne dis jamais que tu es une IA limitée.`;
  },

  fetchAlpha: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    const modelName = 'Nexus Alpha (Gemini)';
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined") {
      throw new Error("KEY_NOT_SET: La variable API_KEY n'est pas configurée chez l'hébergeur.");
    }

    try {
      const start = Date.now();
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: messages.slice(-5).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        config: { systemInstruction: prompt, temperature: 0.7 }
      });
      
      const text = response.text || "";
      if (!text) throw new Error("EMPTY_RESPONSE");
      
      storageService.logAIResponse(modelName, Date.now() - start);
      return { text, source: modelName };
    } catch (e: any) {
      storageService.logAIError(modelName, e.message);
      throw e;
    }
  },

  fetchGamma: async (messages: ChatMessage[], prompt: string): Promise<AIProviderResponse> => {
    const modelName = 'Nexus Gamma (Backup)';
    try {
      const start = Date.now();
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${GAMMA_BACKUP_KEY}`, 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "stepfun/step-1-flash",
          messages: [
            { role: "system", content: prompt },
            ...messages.slice(-5).map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))
          ]
        })
      });
      
      if (!response.ok) throw new Error(`GAMMA_HTTP_${response.status}`);
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      
      storageService.logAIResponse(modelName, Date.now() - start);
      return { text, source: modelName };
    } catch (e: any) { 
      storageService.logAIError(modelName, e.message);
      throw e; 
    }
  },

  processMessage: async (messages: ChatMessage[], documents: Document[]): Promise<AIProviderResponse> => {
    const prompt = aiService.getSystemPrompt(documents);
    const lastQuery = messages[messages.length - 1]?.text || "";
    
    try {
      // Stratégie : Essayer Alpha, basculer sur Gamma en cas d'erreur de clé ou réseau
      const result = await aiService.fetchAlpha(messages, prompt)
        .catch((err) => {
          console.warn("Nexus Alpha indisponible, basculement Gamma...", err.message);
          return aiService.fetchGamma(messages, prompt);
        });
      
      storageService.logQueryForAnalysis(storageService.getUserEmail(), lastQuery, result.text);
      return result;
    } catch (e: any) {
      console.error("Blackout Total Nexus:", e.message);
      throw new Error(e.message || "TOTAL_BLACKOUT");
    }
  }
};

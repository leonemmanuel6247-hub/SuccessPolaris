
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Document } from '../types.ts';
import { storageService } from './storageService.ts';

export interface AIProviderResponse {
  text: string;
  isFallback: boolean;
  status: 'SUCCESS' | 'RELAY' | 'CRITICAL';
  responseTime: number;
}

// Configuration des modèles pour la course (versions rapides/gratuites via OpenRouter)
const RACE_MODELS = [
  { id: 1, model: "openai/gpt-4o-mini" },     // IA 1 (ChatGPT version)
  { id: 2, model: "stepfun/step-1-8k" },      // IA 2 (StepFun)
  { id: 3, model: "deepseek/deepseek-chat" }, // IA 3 (DeepSeek)
  { id: 4, model: "upstage/solar-10-7b-instruct" } // IA 4 (Solar)
];

export const aiService = {
  getSystemInstruction: (documents: Document[]) => {
    const docsContext = documents.length > 0 
      ? documents.map(d => `- ${d.title} (ID: ${d.id})`).join('\n')
      : "Aucune archive PDF détectée.";
    
    const directives = storageService.getIADirectives();
    const notes = storageService.getIANotes();
    
    return `TU ES POLARIS BRAIN, L'ENTITÉ D'ASSISTANCE DE SUCCESSPOLARIS.
CRÉATEUR : Astarté.
STYLE : Futuriste, Poli, Motivant.
DIRECTIVES : ${directives}
NOTES : ${notes}
ARCHIVES : ${docsContext}

CONSIGNE : Réponds avec célérité et précision. Suggère les PDF. Ne mentionne jamais l'IA spécifique utilisée, tu es uniquement Polaris Brain.`;
  },

  /**
   * Fonction de requête individuelle pour la course
   */
  requestAI: async (apiKey: string, model: string, messages: ChatMessage[], systemInstruction: string): Promise<string> => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://successpolaris.com",
        "X-Title": "SuccessPolaris Brain",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemInstruction },
          ...messages.map(m => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.text
          }))
        ]
      })
    });

    if (!response.ok) throw new Error(`Model_${model}_Failed`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty_Response");
    return content;
  },

  /**
   * CANAL DE SECOURS ULTIME : Gemini
   */
  fetchGeminiFallback: async (messages: ChatMessage[], systemInstruction: string): Promise<string> => {
    // Initialisation du client GoogleGenAI avec la clé API de l'environnement (named parameter obligatoire)
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Appel à generateContent en utilisant gemini-3-pro-preview pour les tâches d'assistance complexes
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 16000 },
        temperature: 0.7
      },
    });
    
    // Accès direct à la propriété .text (et non la méthode .text())
    return response.text || "";
  },

  processMessage: async (messages: ChatMessage[], documents: Document[]): Promise<AIProviderResponse> => {
    const systemInstruction = aiService.getSystemInstruction(documents);
    const start = Date.now();

    // Construction des promesses pour la course
    const racePromises = RACE_MODELS.map(m => {
      const key = (process.env as any)[`NEXT_PUBLIC_API_KEY_${m.id}`];
      if (!key) return Promise.reject(`Key_${m.id}_Missing`);
      return aiService.requestAI(key, m.model, messages, systemInstruction);
    });

    try {
      // PROMISE RACE : Le premier qui répond gagne !
      // FIX: Utilisation d'un cast (Promise as any) pour résoudre l'erreur TS sur Promise.any dans les environnements à cibles anciennes.
      const fastestResponse = await (Promise as any).any(racePromises);
      const end = Date.now();
      storageService.logAIResponse("Polaris_Fast_Nexus", end - start);
      
      return { 
        text: fastestResponse, 
        isFallback: false,
        status: 'SUCCESS',
        responseTime: end - start
      };
    } catch (e: any) {
      console.warn("La course a échoué ou les clés sont vides. Basculement vers le Relais Gemini.");
      
      try {
        const text = await aiService.fetchGeminiFallback(messages, systemInstruction);
        const end = Date.now();
        storageService.logAIResponse("GEMINI_RELAIS", end - start);
        return { 
          text, 
          isFallback: true,
          status: 'RELAY',
          responseTime: end - start
        };
      } catch (err) {
        return { 
          text: "ALERTE : Nexus déconnecté. Toutes les voies de communication sont saturées.", 
          isFallback: true,
          status: 'CRITICAL',
          responseTime: 0
        };
      }
    }
  }
};

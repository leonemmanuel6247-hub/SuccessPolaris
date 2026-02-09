
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Document } from '../types.ts';
import { storageService } from './storageService.ts';

export interface AIProviderResponse {
  text: string;
  source: string;
  status: 'SUCCESS' | 'RELAY' | 'CRITICAL';
  responseTime: number;
}

const RACE_MODELS = [
  { id: 1, model: 'google/gemini-pro' },
  { id: 2, model: 'mistralai/mistral-7b-instruct' },
  { id: 3, model: 'huggingfaceh4/zephyr-7b-beta' },
  { id: 4, model: 'meta-llama/llama-3-8b-instruct' }
];

export const aiService = {
  getSystemInstruction: (documents: Document[]) => {
    const docsContext = documents.length > 0 
      ? documents.map(d => `- ${d.title} (ID: ${d.id})`).join('\n')
      : "Aucune archive PDF détectée.";
    
    return `TU ES POLARIS BRAIN, L'ENTITÉ D'ASSISTANCE DE SUCCESSPOLARIS.
CRÉATEUR : Astarté.
TON STYLE : Futuriste, positif, et ultra-concis.

ARCHIVES DISPONIBLES :
${docsContext}

DIRECTIVES : Réponds en français. Ne mentionne pas que tu es une IA.`;
  },

  requestAI: async (apiKey: string, model: string, messages: ChatMessage[], systemInstruction: string, id: number): Promise<{ text: string, source: string }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://successpolaris.com",
          "X-Title": "Polaris Brain Nexus",
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
          ],
          temperature: 0.7,
          max_tokens: 500
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) throw new Error(`IA-${id} Fail`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response");
      
      return { text: content, source: `IA-${id}` };
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  },

  fetchGeminiFallback: async (messages: ChatMessage[], systemInstruction: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })),
      config: { systemInstruction, temperature: 0.7 },
    });
    return response.text || "Flux de secours interrompu.";
  },

  processMessage: async (messages: ChatMessage[], documents: Document[]): Promise<AIProviderResponse> => {
    const systemInstruction = aiService.getSystemInstruction(documents);
    const start = Date.now();

    const racePromises = RACE_MODELS.map(m => {
      const key = (process.env as any)[`API_KEY_${m.id}`];
      if (!key) return Promise.reject(`Key ${m.id} missing`);
      return aiService.requestAI(key, m.model, messages, systemInstruction, m.id);
    });

    try {
      // Course de flux : la première IA qui répond gagne
      const fastest = await (Promise as any).any(racePromises);
      const end = Date.now();
      storageService.logAIResponse(fastest.source, end - start);
      
      return { 
        text: fastest.text, 
        source: fastest.source,
        status: 'SUCCESS',
        responseTime: end - start
      };
    } catch (e) {
      // Relais de secours Gemini Direct
      try {
        const text = await aiService.fetchGeminiFallback(messages, systemInstruction);
        const end = Date.now();
        storageService.logAIResponse("RELAIS-GEMINI", end - start);
        return { text, source: 'RELAIS-GEMINI', status: 'RELAY', responseTime: end - start };
      } catch (err) {
        return { 
          text: "ERREUR CRITIQUE : Le Nexus Polaris est déconnecté.", 
          source: 'OFFLINE', 
          status: 'CRITICAL', 
          responseTime: 0 
        };
      }
    }
  }
};

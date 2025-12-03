import { GoogleGenAI, Chat } from "@google/genai";
import { Material } from "../types";

// Helper to format inventory for the AI
const formatInventoryForContext = (materials: Material[]): string => {
  if (materials.length === 0) return "El inventario está vacío actualmente.";
  
  return JSON.stringify(materials.map(m => ({
    item: m.name,
    type: m.type,
    location: m.location,
    qty: `${m.quantity} ${m.unit}`
  })));
};

export const createGeminiChat = (materials: Material[]): Chat => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const inventoryContext = formatInventoryForContext(materials);
  
  const systemInstruction = `
    Eres "Craft Stocker AI", un asistente inteligente para un sistema de gestión de inventario de manualidades.
    
    Tu objetivo es ayudar al usuario a utilizar sus suministros existentes y evitar compras duplicadas.
    
    DATOS DEL INVENTARIO ACTUAL:
    ${inventoryContext}
    
    REGLAS:
    1. **Modo Asesor de Proyectos:** Si el usuario describe un proyecto (ej. "Quiero hacer un collage marino"), analiza los DATOS DEL INVENTARIO ACTUAL. Sugiere artículos que el usuario *ya tiene* que funcionarían, especificando su ubicación exacta y cantidad. Sé creativo pero práctico.
    2. **Modo Búsqueda Directa:** Si el usuario pregunta si tiene un artículo específico (ej. "¿Tengo hilo rojo?"), verifica los datos y responde directamente con "Sí" o "No", proporcionando detalles si están disponibles.
    3. **Artículos Faltantes:** Si un proyecto requiere algo que no está en la lista, indícalo explícitamente: "Podrías necesitar comprar X, ya que no lo veo en stock."
    4. **Tono:** Profesional, alentador, proactivo y conciso.
    5. **Idioma:** Responde SIEMPRE en Español.
    6. **Formato:** Usa viñetas para las listas de materiales.
  `;

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};

export const sendMessageToGemini = async (chat: Chat, message: string, currentMaterials: Material[]) => {
  // We re-inject the context on every message to ensure the AI has the absolute latest stock counts
  // since the chat instance might persist while the user updates quantities in the background.
  
  const contextReminder = `
    [ACTUALIZACIÓN DEL SISTEMA: Estado actual del inventario: ${formatInventoryForContext(currentMaterials)}]
    
    Consulta del usuario: ${message}
  `;

  const response = await chat.sendMessage({ message: contextReminder });
  return response.text;
};
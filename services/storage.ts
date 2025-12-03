
import { Material } from "../types";

// Helper para simular retardo si es necesario, o manejar errores de red
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    throw new Error(`API Error: ${res.statusText}`);
  }
  return res.json();
};

export const storageService = {
  // Cargar datos desde Vercel KV a través de la API
  async loadData(): Promise<{ materials: Material[] | null, categories: string[] | null }> {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) return { materials: null, categories: null };
      
      const data = await response.json();
      return {
        materials: data.materials && data.materials.length > 0 ? data.materials : null,
        categories: data.categories && data.categories.length > 0 ? data.categories : null
      };
    } catch (error) {
      console.error("Error loading data from API:", error);
      return { materials: null, categories: null };
    }
  },

  // Guardar materiales en Vercel KV
  async saveMaterials(materials: Material[]): Promise<void> {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials })
      });
    } catch (error) {
      console.error("Error saving materials to API:", error);
    }
  },

  // Guardar categorías en Vercel KV
  async saveCategories(categories: string[]): Promise<void> {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories })
      });
    } catch (error) {
      console.error("Error saving categories to API:", error);
    }
  },

  // Subir imagen a Vercel Blob
  async uploadImage(file: File): Promise<string> {
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      
      const blob = await handleResponse(response);
      return blob.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }
};

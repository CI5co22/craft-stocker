
import { Material } from "../types";

const LOCAL_STORAGE_KEY_MATERIALS = 'craft_stocker_materials';
const LOCAL_STORAGE_KEY_CATEGORIES = 'craft_stocker_categories';

export const storageService = {
  async loadData(): Promise<{ materials: Material[] | null, categories: string[] | null }> {
    try {
      const response = await fetch('/api/data', {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(`Server Error (${response.status}):`, errorText || response.statusText);
        
        // If 404 (File Not Found) or 500, fallback to local storage
        if (response.status === 404 || response.status === 500) {
          console.info("Using local storage fallback.");
          const localMats = localStorage.getItem(LOCAL_STORAGE_KEY_MATERIALS);
          const localCats = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
          return {
            materials: localMats ? JSON.parse(localMats) : null,
            categories: localCats ? JSON.parse(localCats) : null
          };
        }
        return { materials: null, categories: null };
      }
      
      const data = await response.json();
      
      // Update local cache
      if (data.materials) localStorage.setItem(LOCAL_STORAGE_KEY_MATERIALS, JSON.stringify(data.materials));
      if (data.categories) localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(data.categories));
      
      return {
        materials: Array.isArray(data.materials) ? data.materials : null,
        categories: Array.isArray(data.categories) ? data.categories : null
      };
    } catch (error) {
      console.error("Fetch failed, using local storage fallback:", error);
      const localMats = localStorage.getItem(LOCAL_STORAGE_KEY_MATERIALS);
      const localCats = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
      return {
        materials: localMats ? JSON.parse(localMats) : null,
        categories: localCats ? JSON.parse(localCats) : null
      };
    }
  },

  async saveMaterials(materials: Material[]): Promise<void> {
    // Always save to local storage first
    localStorage.setItem(LOCAL_STORAGE_KEY_MATERIALS, JSON.stringify(materials));
    
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials })
      });
      if (!response.ok) console.warn('Cloud sync failed, data saved locally only.');
    } catch (error) {
      console.error("Cloud save failed:", error);
    }
  },

  async saveCategories(categories: string[]): Promise<void> {
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories })
      });
      if (!response.ok) console.warn('Cloud sync failed.');
    } catch (error) {
      console.error("Cloud save failed:", error);
    }
  },

  async uploadImage(file: File): Promise<string> {
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        body: file,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Upload failed:", error);
      // For images, we can't easily fallback to local storage without base64 (which is too large),
      // so we suggest using a default or alert.
      alert("Error al subir imagen. Se usará un icono por defecto.");
      throw error;
    }
  }
};

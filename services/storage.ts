
import { Material } from "../types";

const LOCAL_STORAGE_KEY_MATERIALS = 'craft_stocker_materials';
const LOCAL_STORAGE_KEY_CATEGORIES = 'craft_stocker_categories';
const LOCAL_STORAGE_KEY_LOCATIONS = 'craft_stocker_locations';

// Utilidad para comprimir y redimensionar la imagen antes de subir
const compressImage = async (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); 
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => reject(new Error('Error al procesar imagen'));
    };
    reader.onerror = (error) => reject(error);
  });
};

export const storageService = {
  async loadData(): Promise<{ materials: Material[] | null, categories: string[] | null, locations: string[] | null }> {
    try {
      const response = await fetch('/api/data', {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        if (response.status === 404 || response.status === 500) {
          const localMats = localStorage.getItem(LOCAL_STORAGE_KEY_MATERIALS);
          const localCats = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
          const localLocs = localStorage.getItem(LOCAL_STORAGE_KEY_LOCATIONS);
          return {
            materials: localMats ? JSON.parse(localMats) : null,
            categories: localCats ? JSON.parse(localCats) : null,
            locations: localLocs ? JSON.parse(localLocs) : null
          };
        }
        return { materials: null, categories: null, locations: null };
      }
      
      const data = await response.json();
      
      if (data.materials) localStorage.setItem(LOCAL_STORAGE_KEY_MATERIALS, JSON.stringify(data.materials));
      if (data.categories) localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(data.categories));
      if (data.locations) localStorage.setItem(LOCAL_STORAGE_KEY_LOCATIONS, JSON.stringify(data.locations));
      
      return {
        materials: Array.isArray(data.materials) ? data.materials : null,
        categories: Array.isArray(data.categories) ? data.categories : null,
        locations: Array.isArray(data.locations) ? data.locations : null
      };
    } catch (error) {
      console.error("Fetch failed fallback:", error);
      const localMats = localStorage.getItem(LOCAL_STORAGE_KEY_MATERIALS);
      const localCats = localStorage.getItem(LOCAL_STORAGE_KEY_CATEGORIES);
      const localLocs = localStorage.getItem(LOCAL_STORAGE_KEY_LOCATIONS);
      return {
        materials: localMats ? JSON.parse(localMats) : null,
        categories: localCats ? JSON.parse(localCats) : null,
        locations: localLocs ? JSON.parse(localLocs) : null
      };
    }
  },

  async saveMaterials(materials: Material[]): Promise<void> {
    localStorage.setItem(LOCAL_STORAGE_KEY_MATERIALS, JSON.stringify(materials));
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials })
      });
    } catch (e) {}
  },

  async saveCategories(categories: string[]): Promise<void> {
    localStorage.setItem(LOCAL_STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories })
      });
    } catch (e) {}
  },

  async saveLocations(locations: string[]): Promise<void> {
    localStorage.setItem(LOCAL_STORAGE_KEY_LOCATIONS, JSON.stringify(locations));
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations })
      });
    } catch (e) {}
  },

  async uploadImage(file: File): Promise<string> {
    try {
      const compressedBlob = await compressImage(file);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase() || 'captured_image.jpg';
      const finalFileName = cleanFileName.endsWith('.jpg') || cleanFileName.endsWith('.jpeg') 
        ? cleanFileName 
        : `${cleanFileName.split('.')[0]}.jpg`;

      const response = await fetch(`/api/upload?filename=${encodeURIComponent(finalFileName)}`, {
        method: 'POST',
        body: compressedBlob,
        headers: { 'Content-Type': 'image/jpeg' }
      });
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      throw error;
    }
  }
};

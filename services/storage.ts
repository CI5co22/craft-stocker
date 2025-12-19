
import { Material } from "../types";

const LOCAL_STORAGE_KEY_MATERIALS = 'craft_stocker_materials';
const LOCAL_STORAGE_KEY_CATEGORIES = 'craft_stocker_categories';

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
        const MAX_WIDTH = 1200; // Suficiente para una buena calidad visual
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
          resolve(file); // Fallback al original si falla el canvas
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertimos a JPEG con calidad 0.8 para reducir peso drásticamente
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
  async loadData(): Promise<{ materials: Material[] | null, categories: string[] | null }> {
    try {
      const response = await fetch('/api/data', {
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(`Server Error (${response.status}):`, errorText || response.statusText);
        
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
      // COMPRESIÓN ANTES DE SUBIR
      console.log('Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      const compressedBlob = await compressImage(file);
      console.log('Compressed size:', (compressedBlob.size / 1024 / 1024).toFixed(2), 'MB');

      // Normalizamos el nombre del archivo para la URL de la API
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase() || 'captured_image.jpg';
      const finalFileName = cleanFileName.endsWith('.jpg') || cleanFileName.endsWith('.jpeg') 
        ? cleanFileName 
        : `${cleanFileName.split('.')[0]}.jpg`;

      const response = await fetch(`/api/upload?filename=${encodeURIComponent(finalFileName)}`, {
        method: 'POST',
        body: compressedBlob,
        headers: {
          'Content-Type': 'image/jpeg'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Error al subir la imagen. La foto de la cámara es demasiado grande o hubo un error de conexión. Intenta seleccionar la foto desde la galería si el error persiste.");
      throw error;
    }
  }
};

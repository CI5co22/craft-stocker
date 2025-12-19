
export interface Material {
  id: string;
  type: string;
  name: string;
  description?: string;
  location: string;
  quantity: number;
  unit: string;
  imageUrl?: string;
  lastUpdated?: number;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
}

/**
 * Represents a single message in the AI assistant conversation.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// Empezamos con 0 categorías por defecto para producción
export const DEFAULT_CATEGORIES: string[] = [];

export interface InventoryContextType {
  materials: Material[];
  categories: string[];
  isLoading: boolean;
  addMaterial: (material: Omit<Material, 'id' | 'lastUpdated'>) => void;
  updateMaterial: (id: string, updates: Partial<Omit<Material, 'id' | 'lastUpdated'>>) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  deleteMaterial: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  refreshData: () => Promise<void>;
}


export interface Material {
  id: string;
  type: string; // Changed from enum to string for dynamic categories
  name: string; // Description detailed
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

export const DEFAULT_CATEGORIES = [
  'Papel', 'Tela', 'Hilo/Lana', 'Pintura', 'Adhesivo', 'Joyería/Cuentas', 'Herramienta', 'Otro'
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface InventoryContextType {
  materials: Material[];
  categories: string[];
  isLoading: boolean;
  addMaterial: (material: Omit<Material, 'id' | 'lastUpdated'>) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  incrementQuantity: (id: string) => void;
  decrementQuantity: (id: string) => void;
  deleteMaterial: (id: string) => void;
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  refreshData: () => Promise<void>;
}
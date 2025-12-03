
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Material, InventoryContextType, DEFAULT_CATEGORIES } from '../types';
import { storageService } from '../services/storage';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

// Mock Initial Data in Spanish (Only used if localStorage is empty)
const INITIAL_DATA: Material[] = [
  {
    id: '1',
    type: 'Papel',
    name: 'Cartulina - Azul Marino',
    description: 'Cartulina lisa de alto gramaje',
    location: 'Caja 3',
    quantity: 5,
    unit: 'hojas',
    imageUrl: 'https://picsum.photos/100/100?random=1',
    lastUpdated: Date.now()
  },
  {
    id: '2',
    type: 'Adhesivo',
    name: 'Pegamento Líquido',
    description: 'Pegamento multiusos para manualidades',
    location: 'Cajón Superior',
    quantity: 75,
    unit: 'ml',
    imageUrl: 'https://picsum.photos/100/100?random=2',
    lastUpdated: Date.now()
  },
];

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from LocalStorage or fallback to Initial Data
  const [materials, setMaterials] = useState<Material[]>(INITIAL_DATA);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  // Load from Vercel Blob on mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await storageService.getInventory();
        if (data) {
          setMaterials(data.materials);
          setCategories(data.categories);
        } else {
          // Fallback to localStorage if Blob is empty/error
          const savedMaterials = localStorage.getItem('craft-stocker-data');
          const savedCategories = localStorage.getItem('craft-stocker-categories');
          if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
          if (savedCategories) setCategories(JSON.parse(savedCategories));
        }
      } catch (error) {
        console.error('Failed to load inventory from cloud:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Save to Vercel Blob (and localStorage) whenever state changes
  useEffect(() => {
    if (isLoading) return; // Don't save initial empty state overwriting cloud data

    const saveData = async () => {
      try {
        // Save to local storage immediately for offline capability
        localStorage.setItem('craft-stocker-data', JSON.stringify(materials));
        localStorage.setItem('craft-stocker-categories', JSON.stringify(categories));

        // Save to cloud
        await storageService.saveInventory({ materials, categories });
      } catch (error) {
        console.error('Failed to save inventory to cloud:', error);
      }
    };

    // Debounce save to avoid too many API calls
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [materials, categories, isLoading]);

  const addMaterial = (material: Omit<Material, 'id' | 'lastUpdated'>) => {
    const newMaterial: Material = {
      ...material,
      id: crypto.randomUUID(),
      lastUpdated: Date.now(),
    };
    setMaterials(prev => [newMaterial, ...prev]);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    setMaterials(prev => prev.map(m =>
      m.id === id ? { ...m, quantity: Math.max(0, newQuantity), lastUpdated: Date.now() } : m
    ));
  };

  const incrementQuantity = (id: string) => {
    setMaterials(prev => prev.map(m =>
      m.id === id ? { ...m, quantity: m.quantity + 1, lastUpdated: Date.now() } : m
    ));
  };

  const decrementQuantity = (id: string) => {
    setMaterials(prev => prev.map(m =>
      m.id === id ? { ...m, quantity: Math.max(0, m.quantity - 1), lastUpdated: Date.now() } : m
    ));
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const addCategory = (name: string) => {
    if (!categories.includes(name)) {
      setCategories(prev => [...prev, name]);
    }
  };

  const deleteCategory = (name: string) => {
    setCategories(prev => prev.filter(c => c !== name));
  };

  return (
    <InventoryContext.Provider value={{
      materials,
      categories,
      addMaterial,
      updateQuantity,
      incrementQuantity,
      decrementQuantity,
      deleteMaterial,
      addCategory,
      deleteCategory
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

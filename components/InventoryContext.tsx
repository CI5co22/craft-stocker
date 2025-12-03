
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Material, InventoryContextType, DEFAULT_CATEGORIES } from '../types';

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
  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      const saved = localStorage.getItem('craft-stocker-data');
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
      console.error("Error loading materials from storage", e);
      return INITIAL_DATA;
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('craft-stocker-categories');
      return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
    } catch (e) {
      console.error("Error loading categories from storage", e);
      return DEFAULT_CATEGORIES;
    }
  });

  // Persist to LocalStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('craft-stocker-data', JSON.stringify(materials));
    } catch (e) {
      console.error("Failed to save materials", e);
    }
  }, [materials]);

  useEffect(() => {
    try {
      localStorage.setItem('craft-stocker-categories', JSON.stringify(categories));
    } catch (e) {
      console.error("Failed to save categories", e);
    }
  }, [categories]);

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

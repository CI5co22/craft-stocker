
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Material, InventoryContextType } from '../types';
import { storageService } from '../services/storage';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const { materials: loadedMaterials, categories: loadedCategories } = await storageService.loadData();
    
    if (loadedMaterials !== null) setMaterials(loadedMaterials);
    if (loadedCategories !== null) setCategories(loadedCategories);
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!isLoading) {
      storageService.saveMaterials(materials);
    }
  }, [materials, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      storageService.saveCategories(categories);
    }
  }, [categories, isLoading]);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const addMaterial = useCallback((material: Omit<Material, 'id' | 'lastUpdated'>) => {
    const newMaterial: Material = {
      ...material,
      id: generateId(),
      lastUpdated: Date.now(),
    };
    setMaterials(prev => [newMaterial, ...prev]);
  }, []);

  const updateMaterial = useCallback((id: string, updates: Partial<Omit<Material, 'id' | 'lastUpdated'>>) => {
    setMaterials(prev => prev.map(m => 
      m.id === id ? { ...m, ...updates, lastUpdated: Date.now() } : m
    ));
  }, []);

  const updateQuantity = useCallback((id: string, newQuantity: number) => {
    setMaterials(prev => prev.map(m => 
      m.id === id ? { ...m, quantity: Math.max(0, newQuantity), lastUpdated: Date.now() } : m
    ));
  }, []);

  const incrementQuantity = useCallback((id: string) => {
    setMaterials(prev => prev.map(m => 
      m.id === id ? { ...m, quantity: m.quantity + 1, lastUpdated: Date.now() } : m
    ));
  }, []);

  const decrementQuantity = useCallback((id: string) => {
    setMaterials(prev => prev.map(m => 
      m.id === id ? { ...m, quantity: Math.max(0, m.quantity - 1), lastUpdated: Date.now() } : m
    ));
  }, []);

  const deleteMaterial = useCallback((id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  }, []);

  const addCategory = useCallback((name: string) => {
    setCategories(prev => {
      if (!prev.includes(name)) {
        return [...prev, name];
      }
      return prev;
    });
  }, []);

  const updateCategoryName = useCallback((oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    
    // 1. Actualizar la lista de categorías (incluyendo subcategorías afectadas)
    setCategories(prev => prev.map(cat => {
      if (cat === oldName) return newName;
      if (cat.startsWith(`${oldName} / `)) {
        return cat.replace(oldName, newName);
      }
      return cat;
    }));

    // 2. Actualizar los materiales asociados (incluyendo subcategorías afectadas)
    setMaterials(prev => prev.map(m => {
      if (m.type === oldName) {
        return { ...m, type: newName, lastUpdated: Date.now() };
      }
      if (m.type.startsWith(`${oldName} / `)) {
        return { ...m, type: m.type.replace(oldName, newName), lastUpdated: Date.now() };
      }
      return m;
    }));
  }, []);

  const deleteCategory = useCallback((name: string) => {
    setCategories(prev => prev.filter(c => c !== name && !c.startsWith(`${name} / `)));
  }, []);

  return (
    <InventoryContext.Provider value={{ 
      materials, 
      categories,
      isLoading,
      addMaterial, 
      updateMaterial,
      updateQuantity, 
      incrementQuantity, 
      decrementQuantity, 
      deleteMaterial,
      addCategory,
      updateCategoryName,
      deleteCategory,
      refreshData
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

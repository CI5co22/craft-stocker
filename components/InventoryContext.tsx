
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Material, InventoryContextType, DEFAULT_CATEGORIES } from '../types';
import { storageService } from '../services/storage';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Inicializamos con arrays vacíos mientras carga
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar datos iniciales desde el servidor
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const { materials: loadedMaterials, categories: loadedCategories } = await storageService.loadData();
    
    if (loadedMaterials) setMaterials(loadedMaterials);
    if (loadedCategories) setCategories(loadedCategories);
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Persistencia: Guardar cambios cuando el estado cambia
  // IMPORTANTE: Solo guardamos si NO estamos cargando, para evitar sobrescribir con datos vacíos
  useEffect(() => {
    if (!isLoading && materials.length > 0) {
      storageService.saveMaterials(materials);
    }
  }, [materials, isLoading]);

  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      storageService.saveCategories(categories);
    }
  }, [categories, isLoading]);

  // Generador de ID robusto
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const addMaterial = useCallback((material: Omit<Material, 'id' | 'lastUpdated'>) => {
    const newMaterial: Material = {
      ...material,
      id: generateId(),
      lastUpdated: Date.now(),
    };
    setMaterials(prev => [newMaterial, ...prev]);
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

  const deleteCategory = useCallback((name: string) => {
    setCategories(prev => prev.filter(c => c !== name));
  }, []);

  return (
    <InventoryContext.Provider value={{ 
      materials, 
      categories,
      isLoading,
      addMaterial, 
      updateQuantity, 
      incrementQuantity, 
      decrementQuantity, 
      deleteMaterial,
      addCategory,
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


import React, { useState, useMemo, useEffect } from 'react';
import { InventoryProvider, useInventory } from './components/InventoryContext';
import { MaterialCard } from './components/MaterialCard';
import { AddMaterialModal } from './components/AddMaterialModal';
import { CategoryManager } from './components/CategoryManager';
import { Search, Plus, Package, Settings2, ChevronDown, MapPin, Tags, FolderTree, Check, X as CloseIcon } from 'lucide-react';

type ViewMode = 'category' | 'location';

const Dashboard: React.FC = () => {
  const { materials, categories, isLoading, updateMaterial, addCategory } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);
  
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [newSubValue, setNewSubValue] = useState('');

  const lowStockCount = materials.filter(m => m.quantity < 3).length;
  const totalItemsCount = materials.length;

  // Filtrado de materiales base
  const filteredMaterials = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return materials;
    
    return materials.filter(m => {
      return (
        m.name.toLowerCase().includes(searchLower) || 
        m.type.toLowerCase().includes(searchLower) ||
        m.location.toLowerCase().includes(searchLower) ||
        (m.description && m.description.toLowerCase().includes(searchLower))
      );
    });
  }, [materials, searchTerm]);

  const topLevelCategories = useMemo(() => {
    return categories.filter(c => !c.includes('/')).sort();
  }, [categories]);

  const uniqueLocations = useMemo(() => {
    return Array.from(new Set(materials.map(m => m.location.trim()).filter(Boolean))).sort();
  }, [materials]);

  // DETERMINAR QUÉ GRUPOS SON VISIBLES SEGÚN LA BÚSQUEDA
  const visibleGroups = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    const baseGroups = viewMode === 'category' ? topLevelCategories : uniqueLocations;
    
    if (!searchLower) return baseGroups;

    return baseGroups.filter(groupName => {
      if (viewMode === 'category') {
        // Mostrar si el grupo padre tiene materiales filtrados 
        // O si alguna de sus subcategorías tiene materiales filtrados
        // O si el nombre del grupo coincide con la búsqueda
        return (
          groupName.toLowerCase().includes(searchLower) ||
          filteredMaterials.some(m => m.type === groupName || m.type.startsWith(`${groupName} / `))
        );
      } else {
        // En vista por ubicación
        return groupName.toLowerCase().includes(searchLower) || filteredMaterials.some(m => m.location === groupName);
      }
    });
  }, [viewMode, topLevelCategories, uniqueLocations, filteredMaterials, searchTerm]);

  // Auto-expandir grupos cuando hay una búsqueda activa
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const newExpanded: Record<string, boolean> = {};
      visibleGroups.forEach(group => {
        newExpanded[group] = true;
        if (viewMode === 'category') {
          categories.forEach(cat => {
            if (cat.startsWith(`${group} / `) && (cat.toLowerCase().includes(searchTerm.toLowerCase()) || filteredMaterials.some(m => m.type === cat))) {
              newExpanded[cat] = true;
            }
          });
        }
      });
      setExpandedGroups(newExpanded);
    }
  }, [searchTerm, visibleGroups, viewMode, categories, filteredMaterials]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleDragOver = (e: React.DragEvent, groupName: string) => {
    e.preventDefault();
    setDragOverGroup(groupName);
  };

  const handleDragLeave = () => {
    setDragOverGroup(null);
  };

  const handleDrop = (e: React.DragEvent, groupName: string) => {
    e.preventDefault();
    setDragOverGroup(null);
    const materialId = e.dataTransfer.getData('materialId');
    
    if (materialId) {
      if (viewMode === 'category') {
        updateMaterial(materialId, { type: groupName });
      } else {
        updateMaterial(materialId, { location: groupName });
      }
    }
  };

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    setExpandedGroups({});
    setSearchTerm('');
  };

  const startAddSub = (e: React.MouseEvent, parentName: string) => {
    e.stopPropagation();
    setAddingSubTo(parentName);
    setNewSubValue('');
    if (!expandedGroups[parentName]) {
      toggleGroup(parentName);
    }
  };

  const confirmAddSub = (parentName: string) => {
    if (newSubValue.trim()) {
      addCategory(`${parentName} / ${newSubValue.trim()}`);
    }
    setAddingSubTo(null);
    setNewSubValue('');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setSearchTerm('')}>
             <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm group-hover:rotate-12 transition-transform duration-300">
                <Package size={20} />
             </div>
             <span className="font-bold text-xl tracking-tight text-slate-800">Craft Stocker</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="md:hidden bg-emerald-600 text-white p-2 rounded-full shadow-lg active:scale-90 transition-transform"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto md:p-6 space-y-6 flex-grow w-full">
        {/* Estadísticas */}
        <section className="mt-4 md:mt-0 px-4 md:px-0">
          <div className="bg-slate-800 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden transition-all duration-500">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-16 -mt-32 blur-3xl pointer-events-none animate-pulse"></div>
             <div className="relative z-10">
                <h1 className="text-2xl font-bold mb-1">Mi Inventario</h1>
                <p className="text-slate-400 text-sm mb-6">Organización jerárquica para tus materiales</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="text-emerald-400 text-[10px] uppercase font-bold mb-1">Items</div>
                    <div className="text-2xl font-bold">{totalItemsCount}</div>
                  </div>
                  
                  <button 
                    onClick={() => switchView('category')}
                    className={`text-left rounded-xl p-3 border transition-all duration-300 active:scale-95 ${viewMode === 'category' ? 'bg-emerald-600/30 border-emerald-500 ring-1 ring-emerald-500 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-emerald-400 text-[10px] uppercase font-bold">Categorías</div>
                      <FolderTree size={12} className={viewMode === 'category' ? 'text-emerald-400' : 'text-slate-500'} />
                    </div>
                    <div className="text-2xl font-bold">{topLevelCategories.length}</div>
                  </button>

                  <button 
                    onClick={() => switchView('location')}
                    className={`text-left rounded-xl p-3 border transition-all duration-300 active:scale-95 ${viewMode === 'location' ? 'bg-emerald-600/30 border-emerald-500 ring-1 ring-emerald-500 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-emerald-400 text-[10px] uppercase font-bold">Ubicaciones</div>
                      <MapPin size={12} className={viewMode === 'location' ? 'text-emerald-400' : 'text-slate-500'} />
                    </div>
                    <div className="text-2xl font-bold">{uniqueLocations.length}</div>
                  </button>

                  <div className={`rounded-xl p-3 border transition-colors ${lowStockCount > 0 ? 'bg-amber-500/20 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                    <div className="text-amber-300 text-[10px] uppercase font-bold mb-1">Stock Bajo</div>
                    <div className="text-2xl font-bold">{lowStockCount}</div>
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* Buscador y Controles */}
        <section className="px-4 md:px-0 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-grow group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder={`Buscar en ${viewMode === 'category' ? 'categorías' : 'ubicaciones'}...`} 
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-base md:text-sm shadow-sm transition-all focus:shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <CloseIcon size={16} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsCategoryManagerOpen(true)}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                title="Gestionar Categorías"
              >
                <Settings2 size={20} />
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="hidden md:flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
              >
                <Plus size={18} /> Nuevo
              </button>
            </div>
          </div>

          {/* Listado de Grupos Filtrados */}
          <div className="space-y-3">
            {isLoading ? (
               <div className="py-20 text-center animate-pulse">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
                 <p className="mt-4 text-slate-500 text-sm">Cargando inventario...</p>
               </div>
            ) : visibleGroups.length > 0 ? (
              visibleGroups.map((groupName) => {
                const isExpanded = !!expandedGroups[groupName];
                const isBeingDraggedOver = dragOverGroup === groupName;
                const searchLower = searchTerm.toLowerCase().trim();
                
                // Materiales directos que coinciden con la búsqueda
                const directMaterials = filteredMaterials.filter(m => 
                   viewMode === 'category' ? m.type === groupName : m.location === groupName
                );
                
                // Subcategorías que existen bajo este padre
                const allSubcategoriesInGroup = viewMode === 'category' 
                   ? categories.filter(c => c.startsWith(`${groupName} / `)).sort()
                   : [];

                // Solo filtrar subcategorías si hay una búsqueda activa
                const visibleSubcategories = searchLower 
                  ? allSubcategoriesInGroup.filter(subName => 
                      subName.toLowerCase().includes(searchLower) ||
                      filteredMaterials.some(m => m.type === subName)
                    )
                  : allSubcategoriesInGroup;

                return (
                  <div 
                    key={groupName} 
                    className={`bg-white rounded-xl border transition-all duration-200 ${isBeingDraggedOver ? 'border-emerald-500 ring-2 ring-emerald-200 bg-emerald-50/30' : 'border-slate-200 hover:border-emerald-100'}`}
                    onDragOver={(e) => handleDragOver(e, groupName)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, groupName)}
                  >
                    <div 
                      onClick={() => toggleGroup(groupName)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                           <ChevronDown size={20} className="text-slate-400 group-hover:text-emerald-500" />
                        </div>
                        <div className="flex items-center gap-2">
                          {viewMode === 'location' ? (
                            <MapPin size={16} className="text-emerald-600" />
                          ) : (
                            <Tags size={16} className="text-emerald-600" />
                          )}
                          <span className="font-bold text-slate-700">{groupName}</span>
                        </div>
                        
                        {(directMaterials.length > 0 || visibleSubcategories.length > 0) && (
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-wider group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                            {directMaterials.length} {viewMode === 'category' && visibleSubcategories.length > 0 ? `+ ${visibleSubcategories.length} subs` : ''}
                          </span>
                        )}
                      </div>

                      {viewMode === 'category' && (
                        <button 
                          onClick={(e) => startAddSub(e, groupName)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-bold uppercase z-10"
                        >
                          <Plus size={14} /> Sub
                        </button>
                      )}
                    </div>

                    <div className={`group-content-enter ${isExpanded || isBeingDraggedOver ? 'group-content-expanded' : ''}`}>
                      <div className={`p-4 border-t border-slate-50 ${isBeingDraggedOver ? 'bg-emerald-50/50' : 'bg-slate-50/30'} flex flex-col gap-4`}>
                        
                        {/* 1. Input Inline para añadir subcategoría */}
                        {addingSubTo === groupName && (
                          <div className="animate-scale-in" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-300 shadow-sm">
                              <FolderTree size={16} className="text-emerald-500 ml-2" />
                              <input 
                                autoFocus
                                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
                                placeholder={`Nueva subcategoría en ${groupName}...`}
                                value={newSubValue}
                                onChange={e => setNewSubValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') confirmAddSub(groupName);
                                  if (e.key === 'Escape') setAddingSubTo(null);
                                }}
                              />
                              <button 
                                onClick={() => confirmAddSub(groupName)}
                                className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                              >
                                <Check size={16} />
                              </button>
                              <button 
                                onClick={() => setAddingSubTo(null)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <CloseIcon size={16} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 2. Subcategorías Anidadas */}
                        {viewMode === 'category' && visibleSubcategories.length > 0 && (
                          <div className="flex flex-col gap-2">
                            {visibleSubcategories.map(subName => {
                              const subMaterials = filteredMaterials.filter(m => m.type === subName);
                              const isSubExpanded = !!expandedGroups[subName];
                              const isSubDraggedOver = dragOverGroup === subName;
                              const displayName = subName.split(' / ').pop();

                              return (
                                <div 
                                  key={subName} 
                                  className={`rounded-xl border transition-all ${isSubDraggedOver ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 bg-white shadow-sm'}`}
                                  onDragOver={(e) => { e.stopPropagation(); handleDragOver(e, subName); }}
                                  onDragLeave={(e) => { e.stopPropagation(); handleDragLeave(); }}
                                  onDrop={(e) => { e.stopPropagation(); handleDrop(e, subName); }}
                                >
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleGroup(subName); }}
                                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`transition-transform duration-300 ${isSubExpanded ? 'rotate-0' : '-rotate-90'}`}>
                                        <ChevronDown size={14} className="text-slate-400 group-hover:text-emerald-500" />
                                      </div>
                                      <FolderTree size={14} className="text-emerald-500/60" />
                                      <span className="text-sm font-semibold text-slate-600">{displayName}</span>
                                      <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">{subMaterials.length}</span>
                                    </div>
                                  </button>

                                  {isSubExpanded && (
                                    <div className="p-3 pt-0">
                                      {subMaterials.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                          {subMaterials.map(m => <MaterialCard key={m.id} material={m} />)}
                                        </div>
                                      ) : (
                                        <div className="text-center py-4 text-xs text-slate-400 italic">Vacío</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* 3. Materiales Directos */}
                        {directMaterials.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {directMaterials.map(material => (
                              <MaterialCard key={material.id} material={material} />
                            ))}
                          </div>
                        )}

                        {directMaterials.length === 0 && visibleSubcategories.length === 0 && !addingSubTo && (
                          <div className="py-8 text-center text-slate-400 text-xs italic">
                            {isBeingDraggedOver ? 'Suelta para mover aquí' : 'No hay materiales aquí.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 animate-scale-in">
                <Package size={40} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No se encontraron resultados para "{searchTerm}".</p>
                <button 
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-emerald-600 font-bold text-xs uppercase hover:underline"
                >
                  Limpiar búsqueda
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        By Gemini and Arnold :p
      </footer>
      
      <AddMaterialModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <CategoryManager isOpen={isCategoryManagerOpen} onClose={() => setIsCategoryManagerOpen(false)} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <InventoryProvider>
      <Dashboard />
    </InventoryProvider>
  );
};

export default App;

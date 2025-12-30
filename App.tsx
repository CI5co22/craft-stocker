
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { InventoryProvider, useInventory } from './components/InventoryContext';
import { MaterialCard } from './components/MaterialCard';
import { AddMaterialModal } from './components/AddMaterialModal';
import { CategoryManager } from './components/CategoryManager';
import { 
  Search, Plus, Package, ChevronDown, 
  MapPin, Tags, FolderTree, Moon, Sun, 
  LayoutGrid, AlertCircle, Eye, EyeOff, X
} from 'lucide-react';

type ViewMode = 'category' | 'location';

const Dashboard: React.FC = () => {
  const { materials, categories, locations, isLoading, updateMaterial } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [showEmptyLocations, setShowEmptyLocations] = useState(false);
  
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  
  const dragEnterCounters = useRef<Record<string, number>>({});
  const dragExpandTimeouts = useRef<Record<string, number | null>>({});
  const openedByDrag = useRef<Set<string>>(new Set());
  const sourceGroupRef = useRef<string | null>(null);
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const searchTerms = useMemo(() => 
    searchTerm.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0)
  , [searchTerm]);

  const filteredMaterials = useMemo(() => {
    if (searchTerms.length === 0) return materials;
    return materials.filter(m => {
      const content = `${m.name} ${m.description || ''} ${m.type} ${m.location}`.toLowerCase();
      return searchTerms.every(term => content.includes(term));
    });
  }, [materials, searchTerms]);

  const visibleGroups = useMemo(() => {
    let baseGroups: string[] = [];
    if (viewMode === 'category') {
      baseGroups = categories.filter(c => !c.includes('/')).sort();
      const hasUncategorized = materials.some(m => !m.type || m.type === '' || m.type === 'Sin categoría');
      if (hasUncategorized) baseGroups.push('Sin categoría');
    } else {
      const locationsWithItems = Array.from(new Set(materials.map(m => m.location.trim()).filter(Boolean)));
      baseGroups = showEmptyLocations 
        ? Array.from(new Set([...locations, ...locationsWithItems])).sort()
        : locationsWithItems.sort();
    }

    if (searchTerms.length === 0) return baseGroups;
    
    return baseGroups.filter(groupName => {
      const groupLower = groupName.toLowerCase();
      const nameMatches = searchTerms.every(term => groupLower.includes(term));
      if (nameMatches) return true;

      return filteredMaterials.some(m => {
        if (viewMode === 'location') return m.location === groupName;
        if (groupName === 'Sin categoría') return !m.type || m.type === '' || m.type === 'Sin categoría';
        return (m.type || '').startsWith(groupName);
      });
    });
  }, [viewMode, categories, locations, filteredMaterials, searchTerms, materials, showEmptyLocations]);

  const handlePresenceEnter = (e: React.DragEvent, group: string) => {
    e.preventDefault();
    dragEnterCounters.current[group] = (dragEnterCounters.current[group] || 0) + 1;

    if (dragEnterCounters.current[group] === 1 && !expandedGroups[group]) {
      if (dragExpandTimeouts.current[group]) clearTimeout(dragExpandTimeouts.current[group]!);
      
      dragExpandTimeouts.current[group] = window.setTimeout(() => {
        setExpandedGroups(prev => {
          if (!prev[group]) openedByDrag.current.add(group);
          return { ...prev, [group]: true };
        });
        dragExpandTimeouts.current[group] = null;
      }, 250);
    }
  };

  const handlePresenceLeave = (e: React.DragEvent, group: string) => {
    e.preventDefault();
    dragEnterCounters.current[group] = Math.max(0, (dragEnterCounters.current[group] || 0) - 1);
    
    if (dragEnterCounters.current[group] === 0) {
      if (dragExpandTimeouts.current[group]) {
        clearTimeout(dragExpandTimeouts.current[group]!);
        dragExpandTimeouts.current[group] = null;
      }
      
      if (openedByDrag.current.has(group)) {
        setExpandedGroups(prev => ({ ...prev, [group]: false }));
        openedByDrag.current.delete(group);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetType: string, isLocation = false) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    dragEnterCounters.current = {};
    
    const materialId = e.dataTransfer.getData('materialId');
    if (materialId) {
      if (isLocation) {
        updateMaterial(materialId, { location: targetType });
      } else {
        const finalType = targetType === 'Sin categoría' ? '' : targetType;
        updateMaterial(materialId, { type: finalType });
      }
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col md:flex-row overflow-x-hidden" onDragEnd={() => setDragOverTarget(null)}>
      
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-600/20">
              <Package size={24} />
            </div>
            <h1 className="font-extrabold text-xl text-slate-800 dark:text-white">Karoo</h1>
          </div>
          <nav className="space-y-1">
            <button onClick={() => setViewMode('category')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${viewMode === 'category' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <LayoutGrid size={18} /> Inventario
            </button>
            <button onClick={() => setViewMode('location')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${viewMode === 'location' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <MapPin size={18} /> Ubicaciones
            </button>
            <button onClick={() => setIsCategoryManagerOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <Tags size={18} /> Categorías
            </button>
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
          <div className="mb-4 text-center">
            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em]">By Gemini and Arnold :)</span>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:brightness-95 transition-all">
            <span className="flex items-center gap-2">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col pb-24 md:pb-0">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3 md:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-3 w-full">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar materiales..." 
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-2.5 md:py-3 pl-11 pr-10 text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none dark:text-white" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400">
                  <X size={14} />
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex items-center justify-center w-11 h-11 md:w-auto md:px-5 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-95 shrink-0"
              title="Nuevo Material"
            >
              <Plus size={20} />
              <span className="hidden md:inline ml-2 font-bold text-sm">Nuevo</span>
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 md:px-8 flex-1 w-full stagger-in">
          <div className="space-y-4">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-20 animate-pulse text-slate-300">
                  <Package size={48} className="mb-4" />
                  <div className="h-4 w-32 bg-current rounded-full"></div>
               </div>
            ) : materials.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-8 shadow-inner">
                  <Package size={44} className="text-emerald-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3 tracking-tight">¡Bienvenido a Karoo!</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-10 text-base">Organiza tu taller de forma inteligente. Crea categorías y añade materiales para empezar.</p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4">
                  <button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all">
                    Añadir mi primer material
                  </button>
                  <button onClick={() => setIsCategoryManagerOpen(true)} className="bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all">
                    Configurar Categorías
                  </button>
                </div>
              </div>
            ) : visibleGroups.length > 0 ? (
              visibleGroups.map((group) => {
                const isExpanded = !!expandedGroups[group] || searchTerms.length > 0;
                const isUncategorizedGroup = group === 'Sin categoría' && viewMode === 'category';
                const directItems = filteredMaterials.filter(m => 
                  viewMode === 'location' ? m.location === group : (isUncategorizedGroup ? !m.type || m.type === '' || m.type === 'Sin categoría' : m.type === group)
                );
                const subcategories = (viewMode === 'category' && !isUncategorizedGroup) 
                  ? categories.filter(c => c.startsWith(`${group} / `)).sort() 
                  : [];
                const isHeaderDragOver = dragOverTarget === group;

                return (
                  <div 
                    key={group}
                    onDragEnter={(e) => handlePresenceEnter(e, group)}
                    onDragLeave={(e) => handlePresenceLeave(e, group)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, group, viewMode === 'location')}
                    className={`glass-card rounded-2xl overflow-hidden border transition-all duration-200 ${isExpanded ? 'border-emerald-500/10 shadow-lg' : 'border-transparent shadow-sm'} ${isHeaderDragOver ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500' : ''}`}
                  >
                    <button 
                      onClick={() => toggleGroup(group)}
                      onDragEnter={() => setDragOverTarget(group)}
                      onDragLeave={() => setDragOverTarget(null)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExpanded ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                          {viewMode === 'category' ? (isUncategorizedGroup ? <AlertCircle size={18} /> : <Tags size={18} />) : <MapPin size={18} />}
                        </div>
                        <div className="text-left">
                          <span className="block font-bold text-slate-800 dark:text-white text-sm md:text-base">{group}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{directItems.length + (viewMode === 'category' ? filteredMaterials.filter(m => m.type.startsWith(`${group} / `)).length : 0)} ítems</span>
                        </div>
                      </div>
                      <ChevronDown size={18} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180 text-emerald-500' : ''}`} />
                    </button>

                    <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden">
                        <div className="px-5 pb-5 space-y-4 pt-2">
                          {viewMode === 'category' && subcategories.map(sub => {
                            const subItems = filteredMaterials.filter(m => m.type === sub);
                            if (searchTerms.length > 0 && subItems.length === 0) return null;
                            const isSubExpanded = !!expandedGroups[sub] || (searchTerms.length > 0 && subItems.length > 0);
                            const isSubDragOver = dragOverTarget === sub;
                            
                            return (
                              <div 
                                key={sub} 
                                onDragEnter={(e) => handlePresenceEnter(e, sub)}
                                onDragLeave={(e) => handlePresenceLeave(e, sub)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, sub)}
                                className={`rounded-xl overflow-hidden border transition-all duration-200 ${isSubDragOver ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500' : 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800'}`}
                              >
                                <button onClick={() => toggleGroup(sub)} className="w-full flex items-center justify-between p-3 hover:bg-white dark:hover:bg-slate-800/50">
                                  <div className="flex items-center gap-2">
                                    <FolderTree size={14} className="text-emerald-500" />
                                    <h4 className="font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">{sub.split(' / ').pop()}</h4>
                                    <span className="text-[9px] font-bold bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500">{subItems.length}</span>
                                  </div>
                                  <ChevronDown size={14} className={`text-slate-300 transition-transform ${isSubExpanded ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`grid transition-all duration-200 ease-in-out ${isSubExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                  <div className="overflow-hidden">
                                    <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                      {subItems.map(m => <MaterialCard key={m.id} material={m} onDragStart={() => sourceGroupRef.current = sub} />)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {directItems.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                              {directItems.map(m => <MaterialCard key={m.id} material={m} onDragStart={() => sourceGroupRef.current = group} />)}
                            </div>
                          ) : subcategories.length === 0 && (
                            <div className="py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                              <p className="text-xs text-slate-400 font-medium italic">Sin materiales en esta categoría</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center">
                <Search size={40} className="mx-auto mb-4 text-slate-200 dark:text-slate-800" />
                <p className="text-slate-500 font-bold">No hay resultados para "{searchTerm}"</p>
                <button onClick={() => setSearchTerm('')} className="mt-2 text-emerald-600 text-sm font-bold hover:underline">Limpiar búsqueda</button>
              </div>
            )}
            
            {/* Firma sutil al final de todo el contenido scrollable en móvil */}
            {!isLoading && (
              <div className="pt-12 pb-8 text-center opacity-30 md:hidden">
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">By Gemini and Arnold :)</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Nav Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 py-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center max-w-lg mx-auto">
            <button 
              onClick={() => setViewMode('category')} 
              className={`flex flex-col items-center gap-1 p-2 transition-all ${viewMode === 'category' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}
            >
              <LayoutGrid size={22} className={viewMode === 'category' ? 'fill-emerald-600/10' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Stock</span>
            </button>
            <button 
              onClick={() => setViewMode('location')} 
              className={`flex flex-col items-center gap-1 p-2 transition-all ${viewMode === 'location' ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}
            >
              <MapPin size={22} className={viewMode === 'location' ? 'fill-emerald-600/10' : ''} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Ubicación</span>
            </button>
            <button 
              onClick={() => setIsCategoryManagerOpen(true)} 
              className="flex flex-col items-center gap-1 p-2 text-slate-400"
            >
              <Tags size={22} />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Categorías</span>
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className="flex flex-col items-center gap-1 p-2 text-slate-400"
            >
              {darkMode ? <Sun size={22} /> : <Moon size={22} />}
              <span className="text-[10px] font-bold uppercase tracking-tighter">{darkMode ? 'Claro' : 'Oscuro'}</span>
            </button>
          </div>
        </nav>
      </main>

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

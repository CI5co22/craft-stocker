
import React, { useState, useMemo } from 'react';
import { InventoryProvider, useInventory } from './components/InventoryContext';
import { MaterialCard } from './components/MaterialCard';
import { AddMaterialModal } from './components/AddMaterialModal';
import { CategoryManager } from './components/CategoryManager';
import { GeminiAssistant } from './components/GeminiAssistant';
import { Search, Plus, Package, Settings2, RefreshCw, ChevronDown, ChevronRight, AlertTriangle, Box, MapPin, Tags } from 'lucide-react';

type ViewMode = 'category' | 'location';

const Dashboard: React.FC = () => {
  const { materials, categories, isLoading, refreshData } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  
  // Explicitly initialize all groups as false (closed)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const lowStockCount = materials.filter(m => m.quantity < 3).length;
  const totalItemsCount = materials.length;

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const searchLower = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(searchLower) || 
        m.type.toLowerCase().includes(searchLower) ||
        m.location.toLowerCase().includes(searchLower) ||
        (m.description && m.description.toLowerCase().includes(searchLower))
      );
    });
  }, [materials, searchTerm]);

  const groupedData = useMemo(() => {
    const groups: Record<string, typeof materials> = {};
    
    if (viewMode === 'category') {
      categories.forEach(cat => groups[cat] = []);
      filteredMaterials.forEach(m => {
        const cat = categories.includes(m.type) ? m.type : 'Otro';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(m);
      });
    } else {
      filteredMaterials.forEach(m => {
        const loc = m.location.trim() || 'Sin Ubicación';
        if (!groups[loc]) groups[loc] = [];
        groups[loc].push(m);
      });
    }

    return groups;
  }, [filteredMaterials, categories, viewMode]);

  const groupsToShow = useMemo(() => {
    const allKeys = Object.keys(groupedData).sort();
    if (!searchTerm) return allKeys;
    return allKeys.filter(key => groupedData[key].length > 0);
  }, [groupedData, searchTerm]);

  const uniqueLocationsCount = useMemo(() => {
    return new Set(materials.map(m => m.location.trim()).filter(Boolean)).size;
  }, [materials]);

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    setExpandedGroups({}); // Always close all when switching views
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm">
                <Package size={20} />
             </div>
             <span className="font-bold text-xl tracking-tight text-slate-800">Craft Stocker</span>
          </div>
          
          <div className="flex items-center gap-2">
             <button 
                onClick={() => refreshData()}
                disabled={isLoading}
                className={`p-2 text-slate-500 hover:text-emerald-600 rounded-full transition-all ${isLoading ? 'animate-spin' : ''}`}
                title="Sincronizar"
             >
                <RefreshCw size={20} />
             </button>
             <button 
                onClick={() => setShowAssistant(!showAssistant)}
                className={`p-2 rounded-full transition-all ${showAssistant ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
                title="Asistente IA"
             >
                <Box size={20} />
             </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="md:hidden bg-emerald-600 text-white p-2 rounded-full shadow-lg"
            >
              <Plus size={24} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto md:p-6 space-y-6 flex-grow w-full">
        {showAssistant && (
          <section className="px-4 md:px-0">
            <GeminiAssistant />
          </section>
        )}

        <section className="mt-4 md:mt-0 px-4 md:px-0">
          <div className="bg-slate-800 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-16 -mt-32 blur-3xl pointer-events-none"></div>
             
             <div className="relative z-10">
                <h1 className="text-2xl font-bold mb-1">Mi Inventario</h1>
                <p className="text-slate-400 text-sm mb-6">Toca una estadística para cambiar la agrupación</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className="text-emerald-400 text-[10px] uppercase font-bold mb-1">Items</div>
                    <div className="text-2xl font-bold">{totalItemsCount}</div>
                  </div>
                  
                  <button 
                    onClick={() => switchView('category')}
                    className={`text-left rounded-xl p-3 border transition-all ${viewMode === 'category' ? 'bg-emerald-600/30 border-emerald-500 ring-1 ring-emerald-500 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-emerald-400 text-[10px] uppercase font-bold">Categorías</div>
                      <Tags size={12} className={viewMode === 'category' ? 'text-emerald-400' : 'text-slate-500'} />
                    </div>
                    <div className="text-2xl font-bold">{categories.length}</div>
                  </button>

                  <button 
                    onClick={() => switchView('location')}
                    className={`text-left rounded-xl p-3 border transition-all ${viewMode === 'location' ? 'bg-emerald-600/30 border-emerald-500 ring-1 ring-emerald-500 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-emerald-400 text-[10px] uppercase font-bold">Ubicaciones</div>
                      <MapPin size={12} className={viewMode === 'location' ? 'text-emerald-400' : 'text-slate-500'} />
                    </div>
                    <div className="text-2xl font-bold">{uniqueLocationsCount}</div>
                  </button>

                  <div className={`rounded-xl p-3 border ${lowStockCount > 0 ? 'bg-amber-500/20 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
                    <div className="text-amber-300 text-[10px] uppercase font-bold mb-1">Stock Bajo</div>
                    <div className="text-2xl font-bold">{lowStockCount}</div>
                  </div>
                </div>
             </div>
          </div>
        </section>

        <section className="px-4 md:px-0 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder={`Buscar en ${viewMode === 'category' ? 'categorías' : 'ubicaciones'}...`} 
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsCategoryManagerOpen(true)}
                className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                title="Editar Categorías"
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

          <div className="space-y-3">
            {isLoading ? (
               <div className="py-20 text-center">
                 <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
                 <p className="mt-4 text-slate-500 text-sm">Cargando inventario...</p>
               </div>
            ) : groupsToShow.length > 0 ? (
              groupsToShow.map(groupName => {
                const items = groupedData[groupName];
                const isExpanded = !!expandedGroups[groupName];
                const hasLowStock = items.some(i => i.quantity < 3);

                return (
                  <div key={groupName} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                    <button 
                      onClick={() => toggleGroup(groupName)}
                      className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-slate-400" />
                        ) : (
                          <ChevronRight size={20} className="text-slate-400" />
                        )}
                        <div className="flex items-center gap-2">
                          {viewMode === 'location' ? <MapPin size={16} className="text-emerald-600" /> : <Tags size={16} className="text-emerald-600" />}
                          <span className="font-bold text-slate-700">{groupName}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </span>
                        {hasLowStock && (
                          <div className="flex items-center gap-1 text-amber-600 text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                            <AlertTriangle size={12} />
                            Bajo
                          </div>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 bg-slate-50/30 border-t border-slate-50 animate-in slide-in-from-top-2 duration-200">
                        {items.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {items.map(material => (
                              <MaterialCard key={material.id} material={material} />
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-slate-400 text-sm italic">
                            No hay materiales aquí.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <Package size={40} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No se encontraron resultados.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
        Cloud Sync Active &bull; Craft Stocker v1.6
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

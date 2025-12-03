
import React, { useState, useMemo } from 'react';
import { InventoryProvider, useInventory } from './components/InventoryContext';
import { MaterialCard } from './components/MaterialCard';
import { AddMaterialModal } from './components/AddMaterialModal';
import { CategoryManager } from './components/CategoryManager';
import { Search, Plus, Package, Filter, Settings2, AlertTriangle, Layers, Box } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { materials, categories } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Stats
  const lowStockCount = materials.filter(m => m.quantity < 3).length;
  const totalItems = materials.reduce((acc, curr) => acc + curr.quantity, 0);

  // Derive unique locations for the filter dropdown (Smart Deduplication)
  const uniqueLocations = useMemo(() => {
    const rawLocations = materials.map(m => m.location).filter(Boolean);
    const uniqueMap = new Map<string, string>(); // lowercase -> display name
    
    rawLocations.forEach(loc => {
      const lower = loc.toLowerCase().trim();
      // Prefer the version with more capital letters or the first one seen
      if (!uniqueMap.has(lower) || (loc !== lower && uniqueMap.get(lower) === lower)) {
        uniqueMap.set(lower, loc.trim());
      }
    });
    
    return Array.from(uniqueMap.values()).sort();
  }, [materials]);

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
    // Smart location matching: "Caja" matches "caja"
    const matchesLocation = locationFilter 
      ? m.location.toLowerCase() === locationFilter.toLowerCase() 
      : true;
    
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-700">
             <div className="bg-indigo-600 text-white p-1.5 rounded-lg shadow-sm">
                <Package size={20} />
             </div>
             <span className="font-bold text-xl tracking-tight hidden md:block">Craft Stocker</span>
             <span className="font-bold text-xl tracking-tight md:hidden">CraftStocker</span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="md:hidden bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto md:p-6 space-y-6">
        
        {/* Inventory Summary Hero (Replaces AI Chat but keeps design aesthetic) */}
        <section className="mt-4 md:mt-0 px-4 md:px-0">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
             {/* Decorative Elements */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-32 blur-3xl pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full -ml-16 -mb-32 blur-3xl pointer-events-none"></div>

             <div className="relative z-10">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Panel de Control</h1>
                <p className="text-indigo-100 text-sm md:text-base opacity-90 max-w-xl">
                  Bienvenido a tu sistema de organización. Aquí tienes un resumen rápido del estado de tu taller.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs uppercase font-bold tracking-wider">
                      <Box size={14} /> Total Items
                    </div>
                    <div className="text-2xl md:text-3xl font-bold">{materials.length}</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs uppercase font-bold tracking-wider">
                      <Layers size={14} /> Unidades
                    </div>
                    <div className="text-2xl md:text-3xl font-bold">{totalItems}</div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-1 text-indigo-200 text-xs uppercase font-bold tracking-wider">
                      <Filter size={14} /> Categorías
                    </div>
                    <div className="text-2xl md:text-3xl font-bold">{categories.length}</div>
                  </div>

                   <div className={`backdrop-blur-sm rounded-xl p-4 border ${lowStockCount > 0 ? 'bg-amber-500/20 border-amber-400/30' : 'bg-white/10 border-white/10'}`}>
                    <div className={`flex items-center gap-2 mb-1 text-xs uppercase font-bold tracking-wider ${lowStockCount > 0 ? 'text-amber-200' : 'text-indigo-200'}`}>
                      <AlertTriangle size={14} /> Stock Bajo
                    </div>
                    <div className={`text-2xl md:text-3xl font-bold ${lowStockCount > 0 ? 'text-amber-100' : 'text-white'}`}>{lowStockCount}</div>
                  </div>
                </div>
             </div>
          </div>
        </section>

        {/* Dashboard Controls */}
        <section className="px-4 md:px-0">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-6">
            <div className="w-full md:w-auto">
               <h2 className="text-xl font-bold text-slate-800">Listado de Materiales</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar material..." 
                  className="w-full sm:w-56 pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Location Filter */}
              <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <select 
                    className="w-full sm:w-48 pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm appearance-none shadow-sm cursor-pointer"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                 >
                    <option value="">Todas las ubicaciones</option>
                    {uniqueLocations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                 </select>
              </div>

              {/* Manage Categories Button */}
              <button 
                onClick={() => setIsCategoryManagerOpen(true)}
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg font-medium transition-colors text-sm shadow-sm"
                title="Gestionar Categorías"
              >
                <Settings2 size={16} />
                <span className="hidden sm:inline">Categorías</span>
              </button>

              {/* Add Item Button (Desktop) */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium transition-all shadow-md shadow-indigo-200 active:scale-95"
              >
                <Plus size={18} />
                Agregar
              </button>
            </div>
          </div>

          {/* Inventory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map(material => (
                <MaterialCard key={material.id} material={material} />
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="text-lg font-medium">No se encontraron materiales</p>
                <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">Intenta ajustar los filtros o agrega un nuevo artículo a tu colección.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setLocationFilter(''); }} 
                  className="text-indigo-600 hover:text-indigo-700 hover:underline mt-4 text-sm font-medium"
                >
                    Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </section>
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

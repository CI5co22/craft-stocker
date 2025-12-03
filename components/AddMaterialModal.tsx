
import React, { useState, useRef } from 'react';
import { Material } from '../types';
import { useInventory } from './InventoryContext';
import { X, Save, Upload, Image as ImageIcon } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMaterialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addMaterial, materials, categories } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Logic to get unique locations (Case Insensitive deduplication)
  // We prefer the capitalized version if multiple variations exist
  const existingLocations = React.useMemo(() => {
    const rawLocations = materials.map(m => m.location).filter(Boolean);
    const uniqueMap = new Map<string, string>();
    
    rawLocations.forEach(loc => {
      const lower = loc.toLowerCase().trim();
      // If we don't have this location yet, or if the current one is "better" formatted (has capitals), store it
      if (!uniqueMap.has(lower) || (loc !== lower && uniqueMap.get(lower) === lower)) {
        uniqueMap.set(lower, loc.trim());
      }
    });
    
    return Array.from(uniqueMap.values()).sort();
  }, [materials]);

  const [formData, setFormData] = useState({
    name: '',
    type: categories[0] || 'Otro',
    location: '',
    quantity: 1,
    unit: 'unidades',
    description: '',
    imageUrl: ''
  });

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMaterial(formData);
    onClose();
    // Reset
    setFormData({
      name: '',
      type: categories[0] || 'Otro',
      location: '',
      quantity: 1,
      unit: 'unidades',
      description: '',
      imageUrl: ''
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Agregar Material</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          
          {/* Image Upload Area */}
          <div className="flex gap-4 items-start">
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 text-slate-400 overflow-hidden relative group"
             >
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Vista previa" />
                ) : (
                  <>
                    <Upload size={20} className="mb-1" />
                    <span className="text-[10px] font-medium uppercase">Foto</span>
                  </>
                )}
                {formData.imageUrl && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">Cambiar</span>
                  </div>
                )}
             </div>
             <input 
               type="file" 
               ref={fileInputRef} 
               className="hidden" 
               accept="image/*" 
               onChange={handleImageUpload}
             />
             
             <div className="flex-1 space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Material</label>
                 <input 
                   required
                   type="text" 
                   className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm placeholder:text-slate-400"
                   placeholder="ej. Papel Acuarela"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                 <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm bg-white"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    {categories.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación</label>
              <input 
                required
                type="text" 
                list="location-suggestions"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                placeholder="ej. Caja A"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
              <datalist id="location-suggestions">
                {existingLocations.map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
            </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cant.</label>
                  <input 
                    required
                    type="number" 
                    step="1"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidad</label>
                  <input 
                    required
                    type="text" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                    placeholder="ej. pzas"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                  />
               </div>
            </div>
          </div>

           <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción (Opcional)</label>
            <textarea 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
              rows={2}
              placeholder="Detalles sobre color, marca o tamaño..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 transition-all shadow-md shadow-indigo-200"
          >
            <Save size={18} />
            Guardar Material
          </button>
        </form>
      </div>
    </div>
  );
};
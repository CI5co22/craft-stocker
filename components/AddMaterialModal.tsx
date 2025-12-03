
import React, { useState, useRef } from 'react';
import { useInventory } from './InventoryContext';
import { X, Save, Upload, Loader2 } from 'lucide-react';
import { storageService } from '../services/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMaterialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addMaterial, materials, categories } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tempImagePreview, setTempImagePreview] = useState<string>('');
  
  // Logic to get unique locations (Case Insensitive deduplication)
  const existingLocations = React.useMemo(() => {
    const rawLocations = materials.map(m => m.location).filter(Boolean);
    const uniqueMap = new Map<string, string>();
    
    rawLocations.forEach(loc => {
      const lower = loc.toLowerCase().trim();
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setTempImagePreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalImageUrl = formData.imageUrl;

      // Si hay un archivo seleccionado, lo subimos a Vercel Blob
      if (selectedFile) {
        finalImageUrl = await storageService.uploadImage(selectedFile);
      }

      addMaterial({
        ...formData,
        imageUrl: finalImageUrl
      });

      // Cleanup & Close
      handleClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar el material. Por favor intenta de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state
    setFormData({
      name: '',
      type: categories[0] || 'Otro',
      location: '',
      quantity: 1,
      unit: 'unidades',
      description: '',
      imageUrl: ''
    });
    setSelectedFile(null);
    setTempImagePreview('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Agregar Material</h2>
          <button onClick={handleClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          
          {/* Image Upload Area */}
          <div className="flex gap-4 items-start">
             <div 
               onClick={() => !isUploading && fileInputRef.current?.click()}
               className={`w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 text-slate-400 overflow-hidden relative group ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
                {tempImagePreview ? (
                  <img src={tempImagePreview} className="w-full h-full object-cover" alt="Vista previa" />
                ) : (
                  <>
                    <Upload size={20} className="mb-1" />
                    <span className="text-[10px] font-medium uppercase">Foto</span>
                  </>
                )}
                
                {!isUploading && tempImagePreview && (
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
               onChange={handleImageSelect}
               disabled={isUploading}
             />
             
             <div className="flex-1 space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Material</label>
                 <input 
                   required
                   type="text" 
                   className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm placeholder:text-slate-400 text-slate-800"
                   placeholder="ej. Papel Acuarela"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                   disabled={isUploading}
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                 <select 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm bg-white text-slate-800"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    disabled={isUploading}
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
                className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-slate-800"
                placeholder="ej. Caja A"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                disabled={isUploading}
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
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-slate-800"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                    disabled={isUploading}
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidad</label>
                  <input 
                    required
                    type="text" 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-slate-800"
                    placeholder="ej. pzas"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    disabled={isUploading}
                  />
               </div>
            </div>
          </div>

           <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción (Opcional)</label>
            <textarea 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm text-slate-800"
              rows={2}
              placeholder="Detalles sobre color, marca o tamaño..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              disabled={isUploading}
            />
          </div>

          <button 
            type="submit" 
            disabled={isUploading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 transition-all shadow-md shadow-emerald-200/50"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isUploading ? 'Subiendo...' : 'Guardar Material'}
          </button>
        </form>
      </div>
    </div>
  );
};

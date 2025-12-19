
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useInventory } from './InventoryContext';
import { X, Save, Upload, Loader2, AlertCircle, MapPin } from 'lucide-react';
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
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    quantity: 1,
    unit: 'unidades',
    description: '',
    imageUrl: ''
  });

  // Set default category when modal opens or categories change
  useEffect(() => {
    if (isOpen && categories.length > 0 && !formData.type) {
      setFormData(prev => ({ ...prev, type: categories[0] }));
    }
  }, [isOpen, categories, formData.type]);

  const existingLocations = React.useMemo(() => {
    const rawLocations = materials.map(m => m.location).filter(Boolean);
    const uniqueMap = new Map<string, string>();
    rawLocations.forEach(loc => {
      const lower = loc.toLowerCase().trim();
      if (!uniqueMap.has(lower)) uniqueMap.set(lower, loc.trim());
    });
    return Array.from(uniqueMap.values()).sort();
  }, [materials]);

  const filteredLocations = React.useMemo(() => {
    if (!formData.location.trim()) return [];
    const search = formData.location.toLowerCase().trim();
    return existingLocations.filter(loc => 
      loc.toLowerCase().includes(search) && loc.toLowerCase() !== search
    );
  }, [existingLocations, formData.location]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setTempImagePreview(objectUrl);
    }
  };

  const handleSelectLocation = (loc: string) => {
    setFormData({ ...formData, location: loc });
    setShowLocationSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (categories.length === 0) return;
    setIsUploading(true);

    try {
      let finalImageUrl = formData.imageUrl;
      if (selectedFile) {
        finalImageUrl = await storageService.uploadImage(selectedFile);
      }

      addMaterial({
        ...formData,
        imageUrl: finalImageUrl
      });
      handleClose();
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({
      name: '',
      type: categories[0] || '',
      location: '',
      quantity: 1,
      unit: 'unidades',
      description: '',
      imageUrl: ''
    });
    setSelectedFile(null);
    setTempImagePreview('');
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Agregar Material</h2>
          <button onClick={handleClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">No hay categorías</h3>
              <p className="text-slate-500 text-sm mt-1">Primero debes crear al menos una categoría en el panel de gestión (icono de engranaje).</p>
            </div>
            <button 
              onClick={handleClose}
              className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold text-sm"
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
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
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} disabled={isUploading} />
              
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                  <input required type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={isUploading} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                  <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} disabled={isUploading}>
                    {categories.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ubicación</label>
                <div className="relative">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                   <input 
                    required 
                    type="text" 
                    autoComplete="off"
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={formData.location} 
                    onChange={e => {
                      setFormData({...formData, location: e.target.value});
                      setShowLocationSuggestions(true);
                    }} 
                    onFocus={() => setShowLocationSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                    disabled={isUploading} 
                  />
                </div>

                {showLocationSuggestions && filteredLocations.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sugerencias</div>
                    {filteredLocations.map((loc, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2 group"
                      >
                        <MapPin size={12} className="text-slate-300 group-hover:text-emerald-500" />
                        {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cant.</label>
                  <input required type="number" step="any" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})} disabled={isUploading} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Unidad</label>
                  <input required type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} disabled={isUploading} />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción / Notas</label>
              <textarea 
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[60px]" 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                disabled={isUploading}
                placeholder="Detalles adicionales..."
              />
            </div>

            <button type="submit" disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 transition-all shadow-md active:scale-95">
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isUploading ? 'Guardando...' : 'Guardar Material'}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

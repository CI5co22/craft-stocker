
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useInventory } from './InventoryContext';
import { X, Save, Upload, Loader2, Tag, MapPin } from 'lucide-react';
import { storageService } from '../services/storage';
import { Material } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
}

export const EditMaterialModal: React.FC<Props> = ({ isOpen, onClose, material }) => {
  const { updateMaterial, materials, categories } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [tempImagePreview, setTempImagePreview] = useState<string>(material.imageUrl || '');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  const [formData, setFormData] = useState({
    name: material.name,
    type: material.type,
    location: material.location,
    quantity: material.quantity,
    unit: material.unit,
    description: material.description || '',
    imageUrl: material.imageUrl || ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: material.name,
        type: material.type,
        location: material.location,
        quantity: material.quantity,
        unit: material.unit,
        description: material.description || '',
        imageUrl: material.imageUrl || ''
      });
      setTempImagePreview(material.imageUrl || '');
    }
  }, [isOpen, material]);

  const existingLocations = React.useMemo(() => {
    const rawLocations = materials.map(m => m.location).filter(Boolean);
    const unique = Array.from(new Set(rawLocations.map(l => l.toLowerCase().trim())));
    return unique.map(u => rawLocations.find(l => l.toLowerCase().trim() === u)!).sort();
  }, [materials]);

  const filteredLocations = React.useMemo(() => {
    if (!formData.location.trim()) return [];
    const search = formData.location.toLowerCase().trim();
    return existingLocations.filter(loc => 
      loc.toLowerCase().includes(search) && loc.toLowerCase() !== search
    );
  }, [existingLocations, formData.location]);

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
    setIsUploading(true);

    try {
      let finalImageUrl = formData.imageUrl;
      if (selectedFile) {
        finalImageUrl = await storageService.uploadImage(selectedFile);
      }

      updateMaterial(material.id, {
        ...formData,
        imageUrl: finalImageUrl
      });
      onClose();
    } catch (error) {
      console.error("Error al editar:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Editar Material</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex gap-4 items-start">
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 text-slate-400 overflow-hidden relative group"
            >
              {tempImagePreview ? (
                <img src={tempImagePreview} className="w-full h-full object-cover" alt="Vista previa" />
              ) : (
                <>
                  <Upload size={20} className="mb-1" />
                  <span className="text-[10px] font-medium uppercase text-center px-1">Subir Foto</span>
                </>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-[10px] font-bold uppercase">Cambiar</span>
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} disabled={isUploading} />
            
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nombre del Material</label>
                <input required type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={isUploading} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Categoría Actual</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <select 
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none appearance-none" 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})} 
                    disabled={isUploading}
                  >
                    {categories.map(t => <option key={t} value={t}>{t}</option>)}
                    {!categories.includes(formData.type) && <option value={formData.type}>{formData.type}</option>}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-50">
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ubicación física</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={14} />
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
                  <div className="p-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3">Existentes</div>
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cantidad</label>
                <input required type="number" step="any" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value)})} disabled={isUploading} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unidad</label>
                <input required type="text" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} disabled={isUploading} />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Notas / Descripción</label>
            <textarea 
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none min-h-[60px]" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              disabled={isUploading}
            />
          </div>

          <button type="submit" disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 transition-all shadow-md active:scale-[0.98]">
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isUploading ? 'Guardando cambios...' : 'Confirmar Cambios'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

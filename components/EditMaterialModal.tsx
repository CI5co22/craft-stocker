
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useInventory } from './InventoryContext';
import { X, Save, Upload, Loader2, MapPin, ChevronRight, Check } from 'lucide-react';
import { storageService } from '../services/storage';
import { Material } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  material: Material;
}

export const EditMaterialModal: React.FC<Props> = ({ isOpen, onClose, material }) => {
  const { updateMaterial, materials, categories, locations } = useInventory();
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

  const [parentCategory, setParentCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');

  const topLevelCategories = useMemo(() => categories.filter(c => !c.includes('/')).sort(), [categories]);
  
  const availableSubcategories = useMemo(() => {
    if (!parentCategory || parentCategory === 'Sin categoría') return [];
    return categories
      .filter(c => c.startsWith(`${parentCategory} / `))
      .map(c => c.split(' / ').pop()!)
      .sort();
  }, [parentCategory, categories]);

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
      setShowLocationSuggestions(false); 

      if (!material.type || material.type === '' || material.type === 'Sin categoría') {
        setParentCategory('');
        setSubCategory('');
      } else {
        const parts = material.type.split(' / ');
        setParentCategory(parts[0] || '');
        setSubCategory(parts[1] || '');
      }
    }
  }, [isOpen, material]);

  useEffect(() => {
    const fullType = (parentCategory && parentCategory !== 'Sin categoría') 
      ? (subCategory ? `${parentCategory} / ${subCategory}` : parentCategory) 
      : '';
    setFormData(prev => ({ ...prev, type: fullType }));
  }, [parentCategory, subCategory]);

  const existingLocations = useMemo(() => {
    const fromMaterials = materials.map(m => m.location.trim()).filter(Boolean);
    const combined = Array.from(new Set([...locations, ...fromMaterials]));
    return combined.sort();
  }, [materials, locations]);

  const filteredLocations = useMemo(() => {
    const search = formData.location.toLowerCase().trim();
    if (!search) return existingLocations.slice(0, 5);
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
    setFormData(prev => ({ ...prev, location: loc }));
    setShowLocationSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-wider">Actualizar Karoo</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex gap-4 items-start">
            <div 
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 flex flex-col items-center justify-center cursor-pointer bg-slate-50 dark:bg-slate-800 text-slate-400 overflow-hidden relative group"
            >
              {tempImagePreview ? (
                <img src={tempImagePreview} className="w-full h-full object-cover" alt="Preview" />
              ) : (
                <Upload size={20} />
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Nombre</label>
                <input required type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={isUploading} />
              </div>

              <div className="flex flex-col gap-1">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Categoría</label>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500" 
                    value={parentCategory} 
                    onChange={e => { setParentCategory(e.target.value); setSubCategory(''); }}
                    disabled={isUploading}
                  >
                    <option value="">Sin categoría</option>
                    {topLevelCategories.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  
                  {availableSubcategories.length > 0 && (
                    <>
                      <div className="flex items-center text-slate-300"><ChevronRight size={14} /></div>
                      <select 
                        className="flex-1 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500" 
                        value={subCategory} 
                        onChange={e => setSubCategory(e.target.value)}
                        disabled={isUploading}
                      >
                        <option value="">(Ninguna)</option>
                        {availableSubcategories.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="relative">
               <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Ubicación</label>
               <div className="relative">
                 <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                 <input 
                  required 
                  type="text" 
                  autoComplete="off"
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" 
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
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-40 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                  {filteredLocations.map((loc, i) => (
                    <button 
                      key={i} 
                      type="button" 
                      onClick={() => handleSelectLocation(loc)} 
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors flex items-center justify-between group"
                    >
                      {loc}
                      <Check size={12} className="text-emerald-500 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              )}
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Cant.</label>
                  <input required type="number" step="any" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} disabled={isUploading} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Unidad</label>
                  <input required type="text" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} disabled={isUploading} />
                </div>
             </div>
          </div>

          <button type="submit" disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]">
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Actualizar Registro
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

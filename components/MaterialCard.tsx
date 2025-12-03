
import React, { useState } from 'react';
import { Material } from '../types';
import { useInventory } from './InventoryContext';
import { Plus, Minus, MapPin, Trash2, Package, Edit2, Check, X } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  material: Material;
}

export const MaterialCard: React.FC<Props> = ({ material }) => {
  const { updateQuantity, deleteMaterial } = useInventory();
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    deleteMaterial(material.id);
  };

  const handleUse = () => {
    updateQuantity(material.id, Math.max(0, material.quantity - 1));
  };

  const handleAdd = () => {
    updateQuantity(material.id, material.quantity + 1);
  };

  const handleCustomUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customAmount);
    if (!isNaN(val)) {
      updateQuantity(material.id, val);
      setIsEditingAmount(false);
      setCustomAmount('');
    }
  };

  // Status colors - using more muted/professional tones where possible
  const stockLevelColor = material.quantity === 0 
    ? 'bg-red-50 text-red-700 border-red-200' 
    : material.quantity < 3 
      ? 'bg-amber-50 text-amber-700 border-amber-200' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full group relative">
        
        {/* Delete Button (Visible on hover on desktop, always visible on mobile if needed) */}
        <button 
          type="button"
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white/95 text-slate-400 hover:text-red-500 rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-100 hover:border-red-100"
          title="Eliminar material"
        >
          <Trash2 size={16} />
        </button>

        <div className="flex p-3 gap-3 flex-1">
          {/* Image / Icon */}
          <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 relative">
            {material.imageUrl ? (
              <img src={material.imageUrl} alt={material.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Package size={28} />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-slate-800/80 backdrop-blur-sm text-white text-[10px] py-0.5 text-center truncate px-1">
              {material.type}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm leading-tight truncate pr-6" title={material.name}>
                {material.name}
              </h3>
              {material.description && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{material.description}</p>
              )}
              
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 font-medium bg-slate-50 self-start px-2 py-1 rounded-md border border-slate-100 max-w-full">
                <MapPin size={10} className="text-emerald-600 flex-shrink-0" />
                <span className="truncate">{material.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-3">
          {isEditingAmount ? (
            <form onSubmit={handleCustomUpdate} className="flex items-center gap-2">
              <input 
                autoFocus
                type="number" 
                step="any"
                className="w-full text-sm px-2 py-1 border border-emerald-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Nueva cantidad"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <button type="submit" className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                <Check size={16} />
              </button>
              <button 
                type="button" 
                onClick={() => setIsEditingAmount(false)} 
                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
              >
                <X size={16} />
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              {/* Stock Display */}
              <div 
                onClick={() => {
                  setCustomAmount(material.quantity.toString());
                  setIsEditingAmount(true);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer hover:brightness-95 transition-all flex items-center gap-1 ${stockLevelColor}`}
                title="Click para editar cantidad exacta"
              >
                <span className="text-sm">{material.quantity}</span>
                <span className="font-normal opacity-80">{material.unit}</span>
                <Edit2 size={10} className="opacity-50 ml-1" />
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleUse}
                  className="flex items-center gap-1 pl-1 pr-2 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm active:scale-95"
                >
                  <div className="bg-slate-100 rounded p-0.5"><Minus size={10} /></div>
                  Usar
                </button>
                
                <button 
                  onClick={handleAdd}
                  className="flex items-center gap-1 pl-1 pr-2 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 transition-all shadow-sm shadow-emerald-200/50 active:scale-95"
                >
                  <div className="bg-white/20 rounded p-0.5"><Plus size={10} /></div>
                  Agregar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Material"
        message={`¿Estás seguro de que deseas eliminar permanentemente "${material.name}" de tu inventario? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        isDestructive={true}
      />
    </>
  );
};

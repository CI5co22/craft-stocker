
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

  const stockLevelColor = material.quantity === 0 
    ? 'bg-red-50 text-red-700 border-red-200' 
    : material.quantity < 3 
      ? 'bg-amber-50 text-amber-700 border-amber-200' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full group relative">
        {/* Delete Button - Visible on hover/touch */}
        <button 
          type="button"
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 z-10 p-1.5 bg-white/95 text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-100 hover:border-red-100 transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
          title="Eliminar material"
        >
          <Trash2 size={16} />
        </button>

        <div className="flex p-3 gap-3 flex-1">
          <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-slate-50 overflow-hidden border border-slate-100 relative group-hover:bg-slate-100 transition-colors">
            {material.imageUrl ? (
              <img src={material.imageUrl} alt={material.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <Package size={28} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm leading-tight truncate pr-6" title={material.name}>
                {material.name}
              </h3>
              {material.description && (
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{material.description}</p>
              )}
              
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-50 self-start px-2 py-0.5 rounded border border-slate-100 max-w-full">
                <MapPin size={10} className="text-emerald-600 flex-shrink-0" />
                <span className="truncate uppercase tracking-wider">{material.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-3 mt-auto">
          {isEditingAmount ? (
            <form onSubmit={handleCustomUpdate} className="flex items-center gap-2">
              <input 
                autoFocus
                type="number" 
                step="any"
                className="w-full text-sm px-2 py-1 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="0"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <div className="flex gap-1">
                <button type="submit" className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <Check size={16} />
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditingAmount(false)} 
                  className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <div 
                onClick={() => {
                  setCustomAmount(material.quantity.toString());
                  setIsEditingAmount(true);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer hover:brightness-95 transition-all flex items-center gap-1.5 ${stockLevelColor}`}
              >
                <span className="text-sm">{material.quantity}</span>
                <span className="font-medium opacity-80">{material.unit}</span>
                <Edit2 size={10} className="opacity-40" />
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleUse}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
                >
                  <Minus size={12} />
                </button>
                <button 
                  onClick={handleAdd}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-sm"
                >
                  <Plus size={12} />
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
        message={`¿Estás seguro de que deseas eliminar permanentemente "${material.name}"?`}
        confirmText="Eliminar"
        isDestructive={true}
      />
    </>
  );
};


import React, { useState } from 'react';
import { Material } from '../types';
import { useInventory } from './InventoryContext';
import { Plus, Minus, MapPin, Trash2, Package, Edit2, Check, X, Tag, GripVertical } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { EditMaterialModal } from './EditMaterialModal';

interface Props {
  material: Material;
}

export const MaterialCard: React.FC<Props> = ({ material }) => {
  const { updateQuantity, deleteMaterial } = useInventory();
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('materialId', material.id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => setIsDragging(true), 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowEditModal(true);
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
    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50' 
    : material.quantity < 3 
      ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50' 
      : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50';

  return (
    <>
      <div 
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full group relative animate-scale-in cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30 grayscale' : 'opacity-100'}`}
      >
        <div className="absolute top-1/2 left-1 -translate-y-1/2 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
          <GripVertical size={16} />
        </div>

        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0 transition-all duration-200">
          <button 
            type="button"
            onClick={handleEditClick}
            className="p-1.5 bg-white/95 dark:bg-slate-700 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-full shadow-sm border border-slate-100 dark:border-slate-600 hover:border-emerald-100 transition-all active:scale-90"
            title="Editar material"
          >
            <Edit2 size={14} />
          </button>
          <button 
            type="button"
            onClick={handleDeleteClick}
            className="p-1.5 bg-white/95 dark:bg-slate-700 text-slate-400 hover:text-red-500 rounded-full shadow-sm border border-slate-100 dark:border-slate-600 hover:border-red-100 transition-all active:scale-90"
            title="Eliminar material"
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div className="flex p-3 gap-3 flex-1 pl-4 md:pl-6">
          <div 
            onClick={handleEditClick}
            className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg bg-slate-50 dark:bg-slate-900 overflow-hidden border border-slate-100 dark:border-slate-700 relative group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {material.imageUrl ? (
              <img src={material.imageUrl} alt={material.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                <Package size={28} className="group-hover:scale-110 transition-transform duration-300" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 
                onClick={handleEditClick}
                className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate pr-10 cursor-pointer hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors" 
                title={material.name}
              >
                {material.name}
              </h3>
              
              <div className="flex flex-wrap gap-1">
                <div 
                  className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800"
                >
                  <MapPin size={9} className="text-emerald-500 flex-shrink-0" />
                  <span className="truncate uppercase tracking-wider">{material.location}</span>
                </div>
              </div>

              {material.description && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-tight">{material.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 p-3 mt-auto">
          {isEditingAmount ? (
            <form onSubmit={handleCustomUpdate} className="flex items-center gap-2 animate-scale-in">
              <input 
                autoFocus
                type="number" 
                step="any"
                className="w-full text-sm px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all dark:text-white"
                placeholder="0"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <div className="flex gap-1">
                <button type="submit" className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors active:scale-90">
                  <Check size={16} />
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
                className={`px-3 py-1 rounded-full text-[11px] font-bold border cursor-pointer hover:brightness-95 active:scale-95 transition-all flex items-center gap-1.5 ${stockLevelColor}`}
              >
                <span className="text-xs">{material.quantity}</span>
                <span className="font-medium opacity-80">{material.unit}</span>
                <Edit2 size={9} className="opacity-40" />
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={handleUse}
                  className="p-1.5 rounded-lg text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
                >
                  <Minus size={12} />
                </button>
                <button 
                  onClick={handleAdd}
                  className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all active:scale-90"
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

      <EditMaterialModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        material={material} 
      />
    </>
  );
};

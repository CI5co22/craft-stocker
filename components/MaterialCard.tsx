
import React, { useState } from 'react';
import { Material } from '../types';
import { useInventory } from './InventoryContext';
import { Plus, Minus, MapPin, Trash2, Package, Edit2, Tag, AlertTriangle, GripVertical } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { EditMaterialModal } from './EditMaterialModal';

interface Props {
  material: Material;
  viewMode?: 'category' | 'location';
  onDragStart?: () => void;
}

export const MaterialCard: React.FC<Props> = ({ material, viewMode, onDragStart }) => {
  const { updateQuantity, deleteMaterial } = useInventory();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('materialId', material.id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Notificar al Dashboard que este ítem ha empezado a moverse
    if (onDragStart) {
      onDragStart();
    }

    // Usamos setTimeout para que el cambio de opacidad ocurra después de que el navegador cree la imagen fantasma del drag
    setTimeout(() => setIsDragging(true), 0);
  };

  const isLowStock = material.quantity < 3 && material.quantity > 0;
  const isOutOfStock = material.quantity === 0;

  const stockColor = isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-500' : 'text-emerald-500';

  return (
    <>
      <div 
        draggable="true"
        onDragStart={handleDragStart}
        onDragEnd={() => setIsDragging(false)}
        className={`group bg-white dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative overflow-hidden cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-20 scale-95 border-emerald-500' : ''} ${isOutOfStock ? 'grayscale-[0.5]' : ''}`}
      >
        <div className="flex p-2.5 gap-3 items-center flex-1">
          <div className="relative flex-shrink-0">
            <div 
              onClick={() => setShowEditModal(true)}
              className="w-14 h-14 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 overflow-hidden group-hover:scale-105 transition-all cursor-pointer shadow-inner"
            >
              {material.imageUrl ? (
                <img src={material.imageUrl} alt={material.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                  <Package size={20} />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs leading-tight truncate" title={material.name}>
              {material.name}
            </h3>
            
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                <MapPin size={10} className="text-emerald-500/70" />
                <span className="truncate max-w-[60px]">{material.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 mt-1 text-[11px] font-black uppercase">
               <span className={stockColor}>{material.quantity}</span>
               <span className="text-slate-400 lowercase font-medium">{material.unit}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setShowEditModal(true)} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"><Edit2 size={12} /></button>
            <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={12} /></button>
          </div>
        </div>

        <div className="h-9 bg-slate-50 dark:bg-white/5 border-t border-slate-50 dark:border-white/5 flex items-center justify-between px-2">
          <button 
            onClick={() => updateQuantity(material.id, Math.max(0, material.quantity - 1))}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
          >
            <Minus size={14} />
          </button>
          
          <div className="flex-1 flex justify-center">
             <div className={`h-1 w-8 rounded-full ${stockColor} opacity-20`}></div>
          </div>

          <button 
            onClick={() => updateQuantity(material.id, material.quantity + 1)}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMaterial(material.id)}
        title="Borrar"
        message={`¿Borrar "${material.name}"?`}
        isDestructive={true}
      />
      <EditMaterialModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} material={material} />
    </>
  );
};

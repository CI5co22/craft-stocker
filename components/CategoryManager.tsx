
import React, { useState } from 'react';
import { useInventory } from './InventoryContext';
import { X, Plus, Trash2, Tag } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManager: React.FC<Props> = ({ isOpen, onClose }) => {
  const { categories, addCategory, deleteCategory } = useInventory();
  const [newCategory, setNewCategory] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      addCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const handleDelete = (cat: string) => {
    if (window.confirm(`¿Eliminar la categoría "${cat}"?`)) {
      deleteCategory(cat);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Gestionar Categorías</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto max-h-[60vh]">
            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="Nueva categoría..." 
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                />
                <button 
                    type="submit"
                    disabled={!newCategory.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                </button>
            </form>

            <div className="space-y-2">
                {categories.map((cat) => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-700 font-medium text-sm">{cat}</span>
                        <button 
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            title="Eliminar categoría"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

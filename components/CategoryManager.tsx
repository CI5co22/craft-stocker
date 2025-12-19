
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useInventory } from './InventoryContext';
import { X, Plus, Trash2, Tag, Tags, Edit2, Check, FolderTree, ChevronDown } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryManager: React.FC<Props> = ({ isOpen, onClose }) => {
  const { categories, addCategory, updateCategoryName, deleteCategory } = useInventory();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [newSubValue, setNewSubValue] = useState('');
  
  const [expandedInManager, setExpandedInManager] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const toggleExpand = (cat: string) => {
    setExpandedInManager(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      addCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const confirmAddSub = (parent: string) => {
    if (newSubValue.trim()) {
      addCategory(`${parent} / ${newSubValue.trim()}`);
      if (!expandedInManager[parent]) toggleExpand(parent);
    }
    setAddingSubTo(null);
    setNewSubValue('');
  };

  const startEditing = (cat: string) => {
    setEditingCategory(cat);
    const parts = cat.split(' / ');
    setEditValue(parts[parts.length - 1]);
  };

  const handleUpdate = (oldName: string) => {
    const parts = oldName.split(' / ');
    parts[parts.length - 1] = editValue.trim();
    const newFullName = parts.join(' / ');
    
    if (editValue.trim() && newFullName !== oldName) {
      updateCategoryName(oldName, newFullName);
    }
    setEditingCategory(null);
  };

  const handleDeleteClick = (cat: string) => {
    setCategoryToDelete(cat);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete);
      setCategoryToDelete(null);
    }
  };

  const topLevel = categories.filter(c => !c.includes('/')).sort();

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-emerald-600 dark:text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Gestionar Categorías</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto max-h-[70vh] space-y-6">
            <form onSubmit={handleAdd} className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Nueva categoría principal..." 
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-800 dark:text-white shadow-sm"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                />
                <button 
                    type="submit"
                    disabled={!newCategory.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-90"
                >
                    <Plus size={22} />
                </button>
            </form>

            <div className="space-y-4">
                {topLevel.length > 0 ? topLevel.map((cat) => {
                    const subCats = categories.filter(c => c.startsWith(`${cat} / `)).sort();
                    const isExpanded = !!expandedInManager[cat];

                    return (
                    <div key={cat} className="space-y-2">
                        <div className={`group flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border transition-all ${editingCategory === cat ? 'border-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900/50' : 'border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-900'}`}>
                            {editingCategory === cat ? (
                                <div className="flex-1 flex items-center gap-1">
                                    <input 
                                        autoFocus
                                        className="flex-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdate(cat);
                                            if (e.key === 'Escape') setEditingCategory(null);
                                        }}
                                    />
                                    <button onClick={() => handleUpdate(cat)} className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Check size={16} /></button>
                                    <button onClick={() => setEditingCategory(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"><X size={16} /></button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => subCats.length > 0 && toggleExpand(cat)}>
                                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'} ${subCats.length === 0 ? 'opacity-0' : 'cursor-pointer'}`}>
                                          <ChevronDown size={14} className="text-slate-400" />
                                        </div>
                                        <Tags size={14} className="text-emerald-500" />
                                        <span className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate">{cat}</span>
                                        {subCats.length > 0 && !isExpanded && (
                                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">({subCats.length})</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => { setAddingSubTo(cat); setNewSubValue(''); }} 
                                          className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors" 
                                          title="Añadir subcategoría"
                                        >
                                          <Plus size={16} />
                                        </button>
                                        <button onClick={() => startEditing(cat)} className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm"><Edit2 size={14} /></button>
                                        <button onClick={() => handleDeleteClick(cat)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm"><Trash2 size={14} /></button>
                                    </div>
                                </>
                            )}
                        </div>

                        {(isExpanded || addingSubTo === cat) && (
                          <div className="ml-6 space-y-1.5 border-l-2 border-slate-100 dark:border-slate-800 pl-4 animate-scale-in">
                              {addingSubTo === cat && (
                                <div className="flex items-center gap-1 p-1 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-300 dark:border-emerald-800 rounded-lg mb-2">
                                  <input 
                                    autoFocus
                                    className="flex-1 bg-white dark:bg-slate-900 border-none text-[11px] px-2 py-1 outline-none rounded dark:text-white"
                                    placeholder="Nombre subcategoría..."
                                    value={newSubValue}
                                    onChange={e => setNewSubValue(e.target.value)}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') confirmAddSub(cat);
                                      if (e.key === 'Escape') setAddingSubTo(null);
                                    }}
                                  />
                                  <button onClick={() => confirmAddSub(cat)} className="text-emerald-600 dark:text-emerald-400 p-1 hover:bg-white dark:hover:bg-slate-800 rounded"><Check size={14} /></button>
                                  <button onClick={() => setAddingSubTo(null)} className="text-slate-400 p-1 hover:bg-white dark:hover:bg-slate-800 rounded"><X size={14} /></button>
                                </div>
                              )}

                              {subCats.map(sub => (
                                  <div key={sub} className={`group flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg border transition-all ${editingCategory === sub ? 'border-emerald-500' : 'border-slate-50 dark:border-slate-800 hover:border-emerald-100 dark:hover:border-emerald-900'}`}>
                                      {editingCategory === sub ? (
                                          <div className="flex-1 flex items-center gap-1">
                                              <input 
                                                  autoFocus
                                                  className="flex-1 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded px-2 py-1 text-[11px] outline-none dark:text-white"
                                                  value={editValue}
                                                  onChange={(e) => setEditValue(e.target.value)}
                                                  onKeyDown={(e) => {
                                                      if (e.key === 'Enter') handleUpdate(sub);
                                                      if (e.key === 'Escape') setEditingCategory(null);
                                                  }}
                                              />
                                              <button onClick={() => handleUpdate(sub)} className="p-1 text-emerald-600 dark:text-emerald-400"><Check size={14} /></button>
                                              <button onClick={() => setEditingCategory(null)} className="p-1 text-slate-400"><X size={14} /></button>
                                          </div>
                                      ) : (
                                          <>
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                  <FolderTree size={12} className="text-emerald-400" />
                                                  <span className="text-slate-500 dark:text-slate-400 font-medium text-xs truncate italic">{sub.split(' / ').pop()}</span>
                                              </div>
                                              <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <button onClick={() => startEditing(sub)} className="p-1 text-slate-400 hover:text-emerald-600"><Edit2 size={12} /></button>
                                                  <button onClick={() => handleDeleteClick(sub)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={12} /></button>
                                              </div>
                                          </>
                                      )}
                                  </div>
                              ))}
                          </div>
                        )}
                    </div>
                )}) : (
                    <div className="py-10 text-center text-slate-400">
                        <Tags size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No hay categorías creadas.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de que quieres eliminar "${categoryToDelete}"? Si es una categoría principal, se eliminarán también todas sus subcategorías. Los materiales se mantendrán pero perderán su categoría.`}
        confirmText="Eliminar"
        isDestructive={true}
      />
    </div>,
    document.body
  );
};

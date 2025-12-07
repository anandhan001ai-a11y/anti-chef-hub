import { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Package } from 'lucide-react';
import { CleaningSupply } from '../../lib/supabase';
import AddTaskInput from './AddTaskInput';

type SuppliesSectionProps = {
  supplies: CleaningSupply[];
  onAddSupply: (name: string) => Promise<void>;
  onUpdateSupply: (id: string, name: string) => Promise<void>;
  onDeleteSupply: (id: string) => Promise<void>;
};

function SupplyItem({
  supply,
  onUpdate,
  onDelete,
}: {
  supply: CleaningSupply;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(supply.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editName.trim() && editName !== supply.name) {
      await onUpdate(supply.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(supply.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="group flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent rounded-xl transition-all duration-200">
      <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[#ff7a00] to-[#ff8f2d] flex-shrink-0 shadow-sm" />

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-1.5 border-2 border-[#ff7a00] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/30"
          />
          <button
            onClick={handleSave}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm text-gray-700 font-medium">{supply.name}</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-500 hover:text-[#ff7a00] hover:bg-orange-50 rounded-lg transition-colors"
              title="Edit supply"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(supply.id)}
              className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete supply"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SuppliesSection({
  supplies,
  onAddSupply,
  onUpdateSupply,
  onDeleteSupply,
}: SuppliesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (name: string) => {
    await onAddSupply(name);
    setIsAdding(false);
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-[#ff7a00] to-[#ff8f2d] px-6 py-4 overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1 right-4 w-8 h-8 border-2 border-white rounded-lg rotate-12" />
          <div className="absolute bottom-1 right-12 w-4 h-4 border border-white rounded-full" />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-white font-bold text-lg tracking-wide">Cleaning Supplies</h2>
          </div>
          {supplies.length > 0 && (
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white text-sm font-medium">
                {supplies.length} items
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Supplies List */}
      <div className="p-4">
        <div className="space-y-1 mb-4 max-h-[400px] overflow-y-auto scrollbar-hide">
          {supplies.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <Package className="w-8 h-8 text-orange-300" />
              </div>
              <p className="text-gray-400 text-sm">No supplies listed yet.</p>
              <p className="text-gray-300 text-xs mt-1">Add your first supply below.</p>
            </div>
          ) : (
            supplies.map((supply) => (
              <SupplyItem
                key={supply.id}
                supply={supply}
                onUpdate={onUpdateSupply}
                onDelete={onDeleteSupply}
              />
            ))
          )}
        </div>

        {/* Add Supply Button/Input */}
        {isAdding ? (
          <AddTaskInput
            onAdd={handleAdd}
            onCancel={() => setIsAdding(false)}
            placeholder="Enter supply name..."
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-[#ff7a00] border-2 border-[#ff7a00] border-dashed rounded-xl hover:bg-orange-50 hover:border-solid transition-all duration-200 font-medium text-sm group/btn"
          >
            <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-200" />
            Add supply
          </button>
        )}
      </div>
    </div>
  );
}

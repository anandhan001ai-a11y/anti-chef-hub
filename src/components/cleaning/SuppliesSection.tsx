import { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
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
    <div className="group flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-1.5 border-2 border-orange-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
          <span className="flex-1 text-sm text-gray-700">{supply.name}</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
              title="Edit supply"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(supply.id)}
              className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-orange-500 px-6 py-4">
        <h2 className="text-white font-bold text-lg">Cleaning supplies</h2>
      </div>

      <div className="p-4">
        <div className="space-y-1 mb-4 max-h-[500px] overflow-y-auto">
          {supplies.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No supplies listed yet.</p>
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

        {isAdding ? (
          <AddTaskInput
            onAdd={handleAdd}
            onCancel={() => setIsAdding(false)}
            placeholder="Enter supply name..."
          />
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-orange-500 border-2 border-orange-500 border-dashed rounded-lg hover:bg-orange-50 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add supply
          </button>
        )}
      </div>
    </div>
  );
}

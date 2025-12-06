import { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';

type AddTaskInputProps = {
  onAdd: (text: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
};

export default function AddTaskInput({ onAdd, onCancel, placeholder = 'Enter task description...' }: AddTaskInputProps) {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSave = async () => {
    if (!text.trim()) return;

    setIsSaving(true);
    try {
      await onAdd(text.trim());
      setText('');
      onCancel();
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSaving}
        className="flex-1 px-3 py-2 border-2 border-orange-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm disabled:opacity-50"
      />
      <button
        onClick={handleSave}
        disabled={!text.trim() || isSaving}
        className="p-2 text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Save"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={onCancel}
        disabled={isSaving}
        className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        title="Cancel"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, CleaningTask, CleaningSupply, TaskSectionKey } from '../lib/supabase';

type CleaningTaskContextType = {
  tasks: Record<TaskSectionKey, CleaningTask[]>;
  supplies: CleaningSupply[];
  loading: boolean;
  addTask: (section: TaskSectionKey, text: string) => Promise<void>;
  updateTask: (id: string, text: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string, completed: boolean) => Promise<void>;
  addSupply: (name: string) => Promise<void>;
  updateSupply: (id: string, name: string) => Promise<void>;
  deleteSupply: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
};

const CleaningTaskContext = createContext<CleaningTaskContextType | undefined>(undefined);

export function CleaningTaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Record<TaskSectionKey, CleaningTask[]>>({
    shift: [],
    endOfDay: [],
    weekly: [],
    monthly: [],
  });
  const [supplies, setSupplies] = useState<CleaningSupply[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('cleaning_tasks')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching cleaning tasks:', error);
      return;
    }

    const groupedTasks: Record<TaskSectionKey, CleaningTask[]> = {
      shift: [],
      endOfDay: [],
      weekly: [],
      monthly: [],
    };

    data?.forEach((task) => {
      groupedTasks[task.section as TaskSectionKey].push(task as CleaningTask);
    });

    setTasks(groupedTasks);
  };

  const fetchSupplies = async () => {
    const { data, error } = await supabase
      .from('cleaning_supplies')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      console.error('Error fetching cleaning supplies:', error);
      return;
    }

    setSupplies((data as CleaningSupply[]) || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchSupplies()]);
      setLoading(false);
    };

    loadData();

    const tasksChannel = supabase
      .channel('cleaning_tasks_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cleaning_tasks' },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    const suppliesChannel = supabase
      .channel('cleaning_supplies_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cleaning_supplies' },
        () => {
          fetchSupplies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(suppliesChannel);
    };
  }, []);

  const addTask = async (section: TaskSectionKey, text: string) => {
    const position = tasks[section].length + 1;

    const { error } = await supabase
      .from('cleaning_tasks')
      .insert({
        text,
        section,
        position,
        completed: false,
      });

    if (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, text: string) => {
    const { error } = await supabase
      .from('cleaning_tasks')
      .update({ text, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('cleaning_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const toggleTaskComplete = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('cleaning_tasks')
      .update({ completed, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error toggling task completion:', error);
      throw error;
    }
  };

  const addSupply = async (name: string) => {
    const position = supplies.length + 1;

    const { error } = await supabase
      .from('cleaning_supplies')
      .insert({ name, position });

    if (error) {
      console.error('Error adding supply:', error);
      throw error;
    }
  };

  const updateSupply = async (id: string, name: string) => {
    const { error } = await supabase
      .from('cleaning_supplies')
      .update({ name })
      .eq('id', id);

    if (error) {
      console.error('Error updating supply:', error);
      throw error;
    }
  };

  const deleteSupply = async (id: string) => {
    const { error } = await supabase
      .from('cleaning_supplies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting supply:', error);
      throw error;
    }
  };

  const resetToDefaults = async () => {
    await supabase.from('cleaning_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('cleaning_supplies').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const defaultShiftTasks = [
      'Wipe down and sanitize tables, counters and seats',
      'Clean and sanitize bathrooms',
      'Sweep or vacuum floors',
      'Wipe food and drink off menus',
      'Wipe down condiments',
    ];

    const defaultEndOfDayTasks = [
      'Clean and sanitize tables, counters and seats',
      'Clean and sanitize bathrooms',
      'Clean and sanitize railings and door handles',
      'Clean and sanitize menus',
      'Sweep and mop hard floors',
      'Vacuum rugs and carpeted areas',
      'Clean streaks, fingerprints and smudges from windows',
      'Refill disposable supplies',
      'Wipe down walls if needed',
      'Take out the trash',
      'Take out recycling',
      'Sanitize recycling containers',
      'Send dirty linens to laundry',
    ];

    const defaultWeeklyTasks = [
      'Clean and sanitize doors',
      'Wash windows',
      'Wash mirrors',
      'Dust light fixtures',
      'Dust decor and signs',
      'Deep-clean toilets and sinks',
      'Dust liquor bottles behind the bar',
      'Clean draft lines',
    ];

    const defaultMonthlyTasks = [
      'Deep-clean all bathrooms',
      'Clean and dust light fixtures',
      'Clean and dust ceiling fans',
      'Vacuum all carpets thoroughly',
    ];

    const defaultSupplies = [
      'Cleaning gloves',
      'Surface cleaner',
      'Disinfectant spray',
      'Cleaning cloths',
      'Sponges',
      'Paper towels',
      'Glass cleaner',
      'Broom',
      'Steel wool',
      'Hand sanitizer',
      'Vacuum',
      'Mop',
      'Bucket',
      'Floor cleaner',
      'Scrub brush',
      'Garbage bags',
      'Degreasing solution',
      'Carpet cleaner',
      'Dish detergent',
      'Degreasing spray',
    ];

    const taskInserts = [
      ...defaultShiftTasks.map((text, i) => ({ text, section: 'shift', position: i + 1, completed: false })),
      ...defaultEndOfDayTasks.map((text, i) => ({ text, section: 'endOfDay', position: i + 1, completed: false })),
      ...defaultWeeklyTasks.map((text, i) => ({ text, section: 'weekly', position: i + 1, completed: false })),
      ...defaultMonthlyTasks.map((text, i) => ({ text, section: 'monthly', position: i + 1, completed: false })),
    ];

    await supabase.from('cleaning_tasks').insert(taskInserts);

    const supplyInserts = defaultSupplies.map((name, i) => ({ name, position: i + 1 }));
    await supabase.from('cleaning_supplies').insert(supplyInserts);
  };

  return (
    <CleaningTaskContext.Provider
      value={{
        tasks,
        supplies,
        loading,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        addSupply,
        updateSupply,
        deleteSupply,
        resetToDefaults,
      }}
    >
      {children}
    </CleaningTaskContext.Provider>
  );
}

export function useCleaningTasks() {
  const context = useContext(CleaningTaskContext);
  if (context === undefined) {
    throw new Error('useCleaningTasks must be used within a CleaningTaskProvider');
  }
  return context;
}

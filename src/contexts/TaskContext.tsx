import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Task } from '../lib/supabase';

type TaskContextType = {
  tasks: Task[];
  loading: boolean;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const channel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'completed_at'>) => {
    const { error } = await supabase.from('tasks').insert([task]);
    if (error) throw error;
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updateData: any = { ...updates };

    if (updates.status === 'completed' && !updates.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  };

  const refreshTasks = async () => {
    await fetchTasks();
  };

  return (
    <TaskContext.Provider value={{ tasks, loading, addTask, updateTask, deleteTask, refreshTasks }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}

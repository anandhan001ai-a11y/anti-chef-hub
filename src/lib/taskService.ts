import { supabase } from './supabase';

// Types
export type BoardType = 'todo' | 'taskboard' | 'cleaning';
export type TaskStatus = 'pending' | 'completed';

export type Task = {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    board_type: BoardType;
    section_key: string | null;
    sort_index: number;
    due_date: string | null;
    created_at: string;
    updated_at: string;
};

export type CreateTaskInput = {
    title: string;
    description?: string;
    board_type: BoardType;
    section_key?: string;
    sort_index?: number;
    due_date?: string;
    status?: TaskStatus;
};

export type UpdateTaskInput = Partial<{
    title: string;
    description: string | null;
    status: TaskStatus;
    section_key: string | null;
    sort_index: number;
    due_date: string | null;
}>;

// Get current user ID
export async function getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
}

// Fetch tasks by board type and optional section
export async function fetchTasks(
    boardType: BoardType,
    sectionKey?: string
): Promise<{ data: Task[] | null; error: Error | null }> {
    try {
        let query = supabase
            .from('tasks')
            .select('*')
            .eq('board_type', boardType)
            .order('sort_index', { ascending: true });

        if (sectionKey) {
            query = query.eq('section_key', sectionKey);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching tasks:', error);
            return { data: null, error: new Error(error.message) };
        }

        return { data: data as Task[], error: null };
    } catch (err) {
        console.error('Error fetching tasks:', err);
        return { data: null, error: err as Error };
    }
}

// Create a new task
export async function createTask(
    input: CreateTaskInput
): Promise<{ data: Task | null; error: Error | null }> {
    try {
        const userId = await getCurrentUserId();
        if (!userId) {
            return { data: null, error: new Error('User not authenticated') };
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert([{
                user_id: userId,
                title: input.title,
                description: input.description || null,
                board_type: input.board_type,
                section_key: input.section_key || null,
                sort_index: input.sort_index || 0,
                due_date: input.due_date || null,
                status: input.status || 'pending',
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
            return { data: null, error: new Error(error.message) };
        }

        return { data: data as Task, error: null };
    } catch (err) {
        console.error('Error creating task:', err);
        return { data: null, error: err as Error };
    }
}

// Update an existing task
export async function updateTask(
    id: string,
    updates: UpdateTaskInput
): Promise<{ data: Task | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating task:', error);
            return { data: null, error: new Error(error.message) };
        }

        return { data: data as Task, error: null };
    } catch (err) {
        console.error('Error updating task:', err);
        return { data: null, error: err as Error };
    }
}

// Delete a task
export async function deleteTask(
    id: string
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting task:', error);
            return { error: new Error(error.message) };
        }

        return { error: null };
    } catch (err) {
        console.error('Error deleting task:', err);
        return { error: err as Error };
    }
}

// Toggle task completion
export async function toggleTaskStatus(
    id: string,
    completed: boolean
): Promise<{ data: Task | null; error: Error | null }> {
    return updateTask(id, { status: completed ? 'completed' : 'pending' });
}

// Move task to different section
export async function moveTask(
    id: string,
    sectionKey: string,
    sortIndex: number
): Promise<{ data: Task | null; error: Error | null }> {
    return updateTask(id, { section_key: sectionKey, sort_index: sortIndex });
}

// Reorder tasks within a section
export async function reorderTasks(
    tasks: { id: string; sort_index: number }[]
): Promise<{ error: Error | null }> {
    try {
        for (const task of tasks) {
            const { error } = await supabase
                .from('tasks')
                .update({ sort_index: task.sort_index })
                .eq('id', task.id);

            if (error) {
                console.error('Error reordering task:', error);
                return { error: new Error(error.message) };
            }
        }
        return { error: null };
    } catch (err) {
        console.error('Error reordering tasks:', err);
        return { error: err as Error };
    }
}

import { useState, useEffect } from 'react';
import { Task, fetchTasks } from '../lib/taskService';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CalendarEvent = {
  id: string;
  event_name: string;
  event_date: string;
  event_type: 'holiday' | 'cultural' | 'deadline' | 'special';
  description: string;
};

type CalendarProps = {
  onDateClick: (date: Date) => void;
};

export default function Calendar({ onDateClick }: CalendarProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'year'>('year');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    loadTasks();
    loadEvents();
  }, []);

  const loadTasks = async () => {
    // Load all tasks to show on calendar
    const { data } = await fetchTasks('todo');
    setTasks(data || []);
  };

  const loadEvents = async () => {
    try {
      const { data } = await supabase.from('calendar_events').select('*');
      if (data) setCalendarEvents(data);
    } catch (e) {
      // Calendar events table might not exist
    }
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter((task) => {
      if (task.due_date) {
        return task.due_date.split('T')[0] === dateStr;
      }
      return false;
    });
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter((event) => event.event_date.split('T')[0] === dateStr);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderMonthGrid = (year: number, month: number, compact = false) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-6" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const tasksForDay = getTasksForDate(date);
      const eventsForDay = getEventsForDate(date);
      const isToday = new Date().toDateString() === date.toDateString();
      const hasItems = tasksForDay.length > 0 || eventsForDay.length > 0;

      days.push(
        <div
          key={day}
          onClick={() => onDateClick(date)}
          className={`${compact ? 'h-6 text-xs' : 'h-8'} flex items-center justify-center rounded-lg cursor-pointer transition-all relative ${isToday
              ? 'bg-[#ff7a00] text-white font-bold'
              : hasItems
                ? 'bg-[#ff7a00]/10 text-[#ff7a00] font-medium hover:bg-[#ff7a00]/20'
                : 'hover:bg-gray-100'
            }`}
        >
          {day}
          {hasItems && !compact && (
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
              {tasksForDay.length > 0 && (
                <div className="w-1 h-1 rounded-full bg-[#ff7a00]" />
              )}
              {eventsForDay.length > 0 && (
                <div className="w-1 h-1 rounded-full bg-blue-500" />
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`grid grid-cols-7 gap-1 ${compact ? 'text-xs' : ''}`}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-gray-400 text-xs font-medium">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [];

    for (let month = 0; month < 12; month++) {
      const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'short' });

      months.push(
        <div key={month} className="p-2">
          <h4 className="text-xs font-semibold text-gray-600 mb-1 text-center">{monthName}</h4>
          {renderMonthGrid(year, month, true)}
        </div>
      );
    }

    return <div className="grid grid-cols-3 md:grid-cols-4 gap-2">{months}</div>;
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <div>
        <h3 className="text-lg font-semibold text-center mb-4">{monthName}</h3>
        {renderMonthGrid(year, month)}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-24 shadow-soft p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Calendar</h2>
          <p className="text-sm text-gray-500 mt-1">{currentDate.getFullYear()}</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 text-xs rounded-full transition-all ${view === 'month' ? 'bg-white shadow-sm' : ''
                }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('year')}
              className={`px-3 py-1 text-xs rounded-full transition-all ${view === 'year' ? 'bg-white shadow-sm' : ''
                }`}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mb-4">
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth()))}
          className="p-1 hover:bg-gray-100 rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold">{currentDate.getFullYear()}</span>
        <button
          onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth()))}
          className="p-1 hover:bg-gray-100 rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {view === 'year' ? renderYearView() : renderMonthView()}
    </div>
  );
}

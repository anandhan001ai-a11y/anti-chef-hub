import { useState, useEffect } from 'react';
import { useTasks } from '../contexts/TaskContext';
import { supabase, CalendarEvent } from '../lib/supabase';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CalendarProps = {
  onDateClick: (date: Date) => void;
};

export default function Calendar({ onDateClick }: CalendarProps) {
  const { tasks } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'year'>('year');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from('calendar_events').select('*');
      if (data) setCalendarEvents(data);
    };
    fetchEvents();
  }, []);

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter((task) => {
      if (task.calendar_date) {
        return task.calendar_date === dateStr;
      }
      if (task.due_date) {
        return task.due_date.split('T')[0] === dateStr;
      }
      return false;
    });
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter((event) => event.event_date === dateStr);
  };

  const renderMonthGrid = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const date = new Date(year, month, day);
          const tasksForDay = getTasksForDate(date);
          const eventsForDay = getEventsForDate(date);
          const isToday = new Date().toDateString() === date.toDateString();

          const hasHighPriority = tasksForDay.some((t) => t.priority === 'high');
          const hasCritical = tasksForDay.some(
            (t) => t.task_type === 'audit' || eventsForDay.some((e) => e.event_type === 'deadline')
          );

          return (
            <button
              key={index}
              onClick={() => onDateClick(date)}
              className={`aspect-square rounded-lg text-xs font-medium transition-all hover:shadow-soft ${
                isToday ? 'bg-neon-blue text-white' : 'bg-white hover:bg-gray-50'
              } ${tasksForDay.length > 0 ? 'ring-2 ring-neon-blue/30' : ''}`}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span>{day}</span>
                {(tasksForDay.length > 0 || eventsForDay.length > 0) && (
                  <div className="flex gap-0.5 mt-1">
                    {hasCritical && <div className="w-1 h-1 rounded-full bg-red-500" />}
                    {hasHighPriority && <div className="w-1 h-1 rounded-full bg-neon-orange" />}
                    {tasksForDay.length > 0 && (
                      <div className="w-1 h-1 rounded-full bg-neon-blue" />
                    )}
                    {eventsForDay.length > 0 && (
                      <div className="w-1 h-1 rounded-full bg-neon-green" />
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((monthName, monthIndex) => (
          <div key={monthIndex} className="bg-card-bg rounded-22 p-3">
            <h4 className="text-xs font-semibold text-center mb-2">{monthName}</h4>
            {renderMonthGrid(year, monthIndex)}
          </div>
        ))}
      </div>
    );
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
          <p className="text-sm text-gray-500 mt-1">
            {tasks.filter(t => t.due_date || t.calendar_date).length} scheduled tasks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === 'year' ? 'month' : 'year')}
            className="px-4 py-2 rounded-full text-sm font-medium bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {view === 'year' ? 'Month' : 'Year'} View
          </button>

          {view === 'month' && (
            <>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-hide">
        {view === 'year' ? renderYearView() : renderMonthView()}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-gray-600">Critical/HACCP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-orange" />
          <span className="text-gray-600">High Priority</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-blue" />
          <span className="text-gray-600">Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-neon-green" />
          <span className="text-gray-600">Events</span>
        </div>
      </div>
    </div>
  );
}

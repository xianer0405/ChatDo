import React from 'react';
import { Task } from '../types';
import { CheckCircleIcon, CircleIcon, TrashIcon, CalendarIcon, StickyNoteIcon } from './Icon';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string, completed: boolean) => void;
  onRemove: (id: string) => void;
  onEdit: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onToggle, onRemove, onEdit }) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircleIcon className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-lg font-medium">All caught up!</p>
        <p className="text-sm">Start a chat or use the + button to add new tasks.</p>
      </div>
    );
  }

  // Sort: Incomplete first, then by priority (high > medium > low), then by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Priority Map
    const pMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
    const pA = a.priority ? pMap[a.priority] || 0 : 0;
    const pB = b.priority ? pMap[b.priority] || 0 : 0;

    if (pA !== pB) return pB - pA; // Higher priority first

    // Due Date (earlier first)
    if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate;
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;

    return b.createdAt - a.createdAt;
  });

  const getPriorityColor = (p?: string | null) => {
    switch(p) {
      case 'high': return 'text-red-600 bg-red-50 border-red-100';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-100';
      default: return 'hidden';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-3 p-4 pb-20 md:pb-4">
      {sortedTasks.map((task) => (
        <div
          key={task.id}
          onClick={() => onEdit(task)}
          className={`group flex items-start justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
            task.completed
              ? 'bg-slate-50 border-slate-100 opacity-75'
              : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-100'
          }`}
        >
          <div className="flex items-start gap-3 overflow-hidden flex-1">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(task.id, !task.completed); }}
              className={`flex-shrink-0 mt-0.5 transition-colors ${
                task.completed ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'
              }`}
            >
              {task.completed ? (
                <CheckCircleIcon className="w-6 h-6" />
              ) : (
                <CircleIcon className="w-6 h-6" />
              )}
            </button>
            <div className="flex flex-col gap-1 min-w-0 flex-1">
               <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm md:text-base font-medium transition-all ${
                      task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                    }`}
                  >
                    {task.text}
                  </span>
                  
                  {task.priority && (
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
               </div>

               {(task.dueDate || task.notes) && (
                 <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${task.dueDate < Date.now() && !task.completed ? 'text-red-500 font-medium' : ''}`}>
                        <CalendarIcon className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.notes && (
                      <span className="flex items-center gap-1" title={task.notes}>
                        <StickyNoteIcon className="w-3 h-3" />
                        <span className="truncate max-w-[150px]">{task.notes}</span>
                      </span>
                    )}
                 </div>
               )}
            </div>
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(task.id); }}
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
            aria-label="Delete task"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
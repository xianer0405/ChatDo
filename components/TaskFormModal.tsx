import React, { useState, useEffect } from 'react';
import { AddTaskArgs, Task } from '../types';
import { XIcon, FlagIcon, CalendarIcon, StickyNoteIcon } from './Icon';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: AddTaskArgs) => void;
  initialTask?: Task | null;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSubmit, initialTask }) => {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setText(initialTask.text);
        setPriority(initialTask.priority || '');
        setDueDate(initialTask.dueDate ? new Date(initialTask.dueDate).toISOString().split('T')[0] : '');
        setNotes(initialTask.notes || '');
      } else {
        setText('');
        setPriority('');
        setDueDate('');
        setNotes('');
      }
    }
  }, [isOpen, initialTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSubmit({
      text,
      priority: priority || undefined,
      dueDate: dueDate || undefined,
      notes: notes || undefined,
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {initialTask ? 'Edit Task' : 'Add New Task'}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XIcon className="w-5 h-5" />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
           {/* Task Name */}
           <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Task</label>
               <input 
                  autoFocus
                  type="text" 
                  value={text} 
                  onChange={e => setText(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all"
               />
           </div>

           {/* Priority & Date Row */}
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <FlagIcon className="w-3 h-3" /> Priority
                  </label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 text-sm appearance-none"
                  >
                      <option value="">None</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                  </select>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" /> Due Date
                  </label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-700 text-sm"
                  />
              </div>
           </div>

           {/* Notes */}
           <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <StickyNoteIcon className="w-3 h-3" /> Notes
               </label>
               <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all resize-none text-sm"
               />
           </div>

           <div className="pt-2">
               <button 
                  type="submit" 
                  disabled={!text.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:bg-slate-300 disabled:shadow-none"
               >
                   {initialTask ? 'Save Changes' : 'Add Task'}
               </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
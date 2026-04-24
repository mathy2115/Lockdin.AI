import React, { useState } from 'react';
import { Trash2, Check, Circle, Focus } from 'lucide-react';

const TaskManager = ({ onFocusTask }) => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Maths');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium'); // High, Medium, Low
  const [customSubject, setCustomSubject] = useState('');

  const subjects = ['Maths', 'Physics', 'Chemistry', 'CS', 'English', 'Other'];

  const addTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask = {
      id: Date.now().toString(),
      title,
      subject: subject === 'Other' ? customSubject || 'Other' : subject,
      deadline,
      priority,
      completed: false
    };

    setTasks(prev => [...prev, newTask]);
    setTitle('');
  };

  const toggleComplete = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Sort tasks: Incomplete first, then High > Medium > Low, then by deadline
  const priorityWeight = { High: 3, Medium: 2, Low: 1 };
  
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    if (a.deadline && b.deadline) return new Date(a.deadline) - new Date(b.deadline);
    if (a.deadline) return -1;
    if (b.deadline) return 1;
    return 0;
  });

  const getPriorityColor = (p) => {
    if (p === 'High') return 'bg-red-500';
    if (p === 'Medium') return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Add Task Form */}
      <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-6">
        <h3 className="font-semibold text-fa-text-primary mb-4">Add new task</h3>
        <form onSubmit={addTask} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are you working on?"
            className="w-full bg-[#0A0E1A] border border-fa-border rounded-xl px-4 py-3 text-sm text-fa-text-primary focus:outline-none focus:border-fa-brand"
            required
          />
          
          <div className="grid grid-cols-2 gap-3">
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-[#0A0E1A] border border-fa-border rounded-xl px-3 py-2 text-sm text-fa-text-primary focus:outline-none focus:border-fa-brand"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-[#0A0E1A] border border-fa-border rounded-xl px-3 py-2 text-sm text-fa-text-secondary focus:outline-none focus:border-fa-brand"
            />
          </div>

          {subject === 'Other' && (
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Custom subject..."
              className="w-full bg-[#0A0E1A] border border-fa-border rounded-xl px-4 py-2 text-sm text-fa-text-primary focus:outline-none focus:border-fa-brand"
            />
          )}

          <div className="flex space-x-2">
            {['High', 'Medium', 'Low'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors flex justify-center items-center ${
                  priority === p 
                    ? 'bg-fa-bg-hover border-fa-text-muted text-fa-text-primary' 
                    : 'border-fa-border bg-transparent text-fa-text-muted hover:border-fa-text-muted'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getPriorityColor(p)}`}></span>
                {p}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#6C8EFF] hover:bg-[#6C8EFF]/90 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Add Task
          </button>
        </form>
      </div>

      {/* Task List */}
      <div className="bg-[#1A2236] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-6 flex-1 flex flex-col min-h-0">
        <h3 className="font-semibold text-fa-text-primary mb-4">Your Tasks</h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-10 text-fa-text-muted text-sm">
              No tasks yet. Add something to work on.
            </div>
          ) : (
            sortedTasks.map(task => (
              <div 
                key={task.id} 
                className={`group relative bg-[#0A0E1A] border border-[rgba(255,255,255,0.07)] rounded-xl p-4 transition-all hover:border-fa-text-muted flex gap-3 ${
                  task.completed ? 'opacity-40' : ''
                }`}
              >
                <button 
                  onClick={() => toggleComplete(task.id)}
                  className="mt-0.5 text-fa-text-muted hover:text-fa-brand flex-shrink-0 bg-transparent"
                >
                  {task.completed ? <Check size={18} className="text-emerald-500" /> : <Circle size={18} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-semibold text-[#F0F4FF] mb-1 truncate ${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="px-2 py-0.5 bg-fa-bg-shell rounded-md text-fa-text-secondary truncate max-w-[80px]">
                      {task.subject}
                    </span>
                    {task.deadline && (
                      <span className="text-fa-text-muted">
                        Due: {new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between ml-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${getPriorityColor(task.priority)}`}></div>
                  
                  {!task.completed && (
                    <button 
                      onClick={() => onFocusTask(task.title)}
                      className="opacity-0 group-hover:opacity-100 mt-2 text-xs text-fa-brand hover:text-white flex items-center space-x-1 transition-all bg-transparent"
                    >
                      <Focus size={12} />
                      <span>Focus</span>
                    </button>
                  )}
                </div>

                <button 
                  onClick={() => deleteTask(task.id)}
                  className="absolute -top-2 -right-2 bg-fa-bg-shell border border-fa-border text-red-400 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all shadow-lg"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManager;

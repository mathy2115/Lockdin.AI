import { useState, useEffect } from 'react';
import { Check, Circle, Focus, Layout } from 'lucide-react';

const TaskManager = ({ onFocusTask }) => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('academicTasks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'academicTasks') {
        setTasks(JSON.parse(e.newValue || '[]'));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleComplete = (id) => {
    const updatedTasks = tasks.map(t => {
      if (t.id === id) {
        return { ...t, status: t.status === 'done' ? 'todo' : 'done' };
      }
      return t;
    });
    setTasks(updatedTasks);
    localStorage.setItem('academicTasks', JSON.stringify(updatedTasks));
  };

  const filteredTasks = tasks.filter(t => t.status !== 'done');

  return (
    <div className="flex flex-col h-full bg-[#1A2236] border border-[rgba(255,255,255,0.07)] rounded-[16px] p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Layout size={20} className="text-fa-brand" />
          Your Tasks
        </h3>
        <span className="text-[10px] font-black bg-fa-brand/10 text-fa-brand px-2.5 py-1 rounded-full uppercase tracking-widest">
          {filteredTasks.length} Active
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-fa-text-muted">
            <div className="p-4 bg-white/5 rounded-full mb-4">
              <Check size={32} />
            </div>
            <p className="font-bold text-sm">All caught up!</p>
            <p className="text-xs mt-1">Add tasks in the Academic Hub.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className="group relative bg-[#0A0E1A] border border-white/5 rounded-2xl p-5 transition-all hover:border-fa-brand/50 hover:bg-fa-brand/[0.02] flex gap-4"
            >
              <button 
                onClick={() => toggleComplete(task.id)}
                className="mt-1 text-fa-text-muted hover:text-emerald-500 flex-shrink-0 transition-colors"
              >
                <Circle size={20} />
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-black bg-fa-brand text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {task.subject || 'Study'}
                  </span>
                  {task.status === 'inprogress' && (
                    <span className="text-[9px] font-black bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
                
                <h4 className="text-sm font-bold text-white mb-1 truncate leading-tight">
                  {task.topic || task.title}
                </h4>
                
                {(task.subTopic || task.description) && (
                  <p className="text-xs text-fa-text-secondary line-clamp-2 leading-relaxed italic">
                    {task.subTopic || task.description}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end justify-center">
                <button 
                  onClick={() => onFocusTask(task.topic || task.title)}
                  className="bg-fa-brand/10 hover:bg-fa-brand text-fa-brand hover:text-white p-2.5 rounded-xl transition-all shadow-lg hover:shadow-fa-brand/20 group/focus"
                  title="Focus on this task"
                >
                  <Focus size={18} className="group-hover/focus:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManager;

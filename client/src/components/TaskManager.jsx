import { useState, useEffect } from 'react';
import { Check, Circle, Focus, Layout, ChevronRight, CheckCircle2 } from 'lucide-react';

const TaskManager = ({ onFocusTask }) => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('academicTasks');
    return saved ? JSON.parse(saved) : [];
  });

  // Keep track of tasks being completed to show animation before removal
  const [completingIds, setCompletingIds] = useState(new Set());

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
    // Add to completing set for animation
    setCompletingIds(prev => new Set(prev).add(id));

    // Wait 1 second before actually updating state and localStorage
    setTimeout(() => {
      const updatedTasks = tasks.map(t => {
        if (t.id === id) {
          return { ...t, status: 'done' };
        }
        return t;
      });
      
      setTasks(updatedTasks);
      localStorage.setItem('academicTasks', JSON.stringify(updatedTasks));
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1000);
  };

  // Filter only todo or inprogress tasks
  // We include tasks in the "completing" state so they stay visible during the 1s delay
  const activeTasks = tasks.filter(t => t.status === 'todo' || t.status === 'inprogress');

  return (
    <div className="flex flex-col bg-[#1A2236] border border-white/5 rounded-2xl p-6 shadow-xl w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Layout size={20} className="text-fa-brand" />
          Your Tasks
        </h3>
        <span className="text-[10px] font-black bg-fa-brand/10 text-fa-brand px-2.5 py-1 rounded-full uppercase tracking-widest">
          {activeTasks.length} Active
        </span>
      </div>
      
      <div className="h-[250px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-fa-brand scrollbar-track-fa-bg">
        <style dangerouslySetInnerHTML={{ __html: `
          .scrollbar-thin::-webkit-scrollbar { width: 6px; }
          .scrollbar-thin::-webkit-scrollbar-track { background: #0d1117; border-radius: 10px; }
          .scrollbar-thin::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 10px; }
        `}} />
        
        {activeTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-fa-text-muted">
            <div className="p-3 bg-white/5 rounded-full mb-3">
              <Check size={24} />
            </div>
            <p className="font-bold text-sm">No tasks yet.</p>
            <p className="text-xs mt-1 text-center">Add tasks in Academic Hub.</p>
          </div>
        ) : (
          activeTasks.map(task => {
            const isCompleting = completingIds.has(task.id);
            
            return (
              <div 
                key={task.id} 
                className={`group relative bg-[#0A0E1A] border border-white/5 rounded-xl p-4 transition-all flex items-center gap-4 ${
                  isCompleting ? 'opacity-50 border-emerald-500/30 bg-emerald-500/5' : 'hover:border-fa-brand/50 hover:bg-fa-brand/[0.02]'
                }`}
              >
                <button 
                  onClick={() => !isCompleting && toggleComplete(task.id)}
                  className={`flex-shrink-0 transition-colors ${
                    isCompleting ? 'text-emerald-500' : 'text-fa-text-muted hover:text-emerald-500'
                  }`}
                >
                  {isCompleting ? <CheckCircle2 size={18} fill="currentColor" className="text-emerald-500" /> : <Circle size={18} />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className={`flex items-center gap-1.5 flex-wrap transition-all ${isCompleting ? 'line-through decoration-emerald-500/50' : ''}`}>
                    <span className="text-[10px] font-bold text-fa-brand uppercase tracking-wider">
                      {task.subject || 'General'}
                    </span>
                    <ChevronRight size={10} className="text-fa-text-muted" />
                    <span className={`text-[10px] font-bold text-white uppercase tracking-wider ${isCompleting ? 'text-gray-500' : ''}`}>
                      {task.topic || task.title}
                    </span>
                    {task.subTopic && (
                      <>
                        <ChevronRight size={10} className="text-fa-text-muted" />
                        <span className={`text-[10px] font-medium text-fa-text-secondary truncate max-w-[150px] ${isCompleting ? 'text-gray-600' : ''}`}>
                          {task.subTopic}
                        </span>
                      </>
                    )}
                    {task.status === 'inprogress' && !isCompleting && (
                      <span className="ml-2 text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => onFocusTask(task.topic || task.title)}
                  disabled={isCompleting}
                  className={`bg-fa-brand/10 hover:bg-fa-brand text-fa-brand hover:text-white p-2 rounded-lg transition-all shadow-lg hover:shadow-fa-brand/20 group/focus ${
                    isCompleting ? 'opacity-20 pointer-events-none' : ''
                  }`}
                  title="Focus on this task"
                >
                  <Focus size={16} className="group-hover/focus:scale-110 transition-transform" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TaskManager;

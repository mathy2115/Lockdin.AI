import React, { useState, useEffect, useRef } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { UploadCloud, Loader2, Plus, Calendar, Clock, Circle, CheckCircle2, AlertCircle, X } from 'lucide-react';

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// === DND COMPONENTS ===

const DraggableTask = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id.toString(),
    data: task,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const getPriorityColor = (p) => {
    if (p === 'High') return 'bg-red-500';
    if (p === 'Medium') return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-[#1A2236] border border-white/5 rounded-xl p-4 mb-3 cursor-grab active:cursor-grabbing hover:border-fa-brand/50 transition-colors shadow-sm"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-semibold text-white leading-tight pr-2">{task.title}</h4>
        <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${getPriorityColor(task.priority)}`}></div>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold text-white bg-white/10 px-2 py-0.5 rounded">
          {task.subject}
        </span>
        {task.estimatedHours && (
          <span className="text-[10px] text-fa-text-secondary flex items-center gap-1">
            <Clock size={10} /> {task.estimatedHours}h
          </span>
        )}
      </div>

      {task.deadline && (
        <div className="flex items-center gap-1.5 text-xs text-fa-text-muted">
          <Calendar size={12} />
          <span>{new Date(task.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        </div>
      )}
    </div>
  );
};

const DroppableColumn = ({ id, title, tasks }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <h3 className="font-semibold text-white">{title}</h3>
        <span className="text-xs font-bold text-fa-text-muted bg-white/5 px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <div 
        ref={setNodeRef} 
        className={`flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors ${
          isOver ? 'bg-fa-brand/5' : ''
        }`}
      >
        {tasks.length === 0 ? (
          <div className="h-32 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-sm text-fa-text-muted">
            Drop tasks here
          </div>
        ) : (
          tasks.map(task => <DraggableTask key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
};

// === MAIN COMPONENT ===

const AcademicPlanner = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const fileInputRef = useRef(null);
  
  // Modal Form State
  const [form, setForm] = useState({ title: '', subject: '', deadline: '', priority: 'Medium', estimatedHours: '' });

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- File Upload & PDF parsing ---
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("Please upload a PDF file.");
      return;
    }

    setIsUploading(true);
    try {
      const extractTextFromPDF = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          fullText += content.items.map(item => item.str).join(' ') + '\n';
        }
        return fullText;
      };

      const fullText = await extractTextFromPDF(file);

      // 4. Send to Gemini backend
      const res = await fetch('/api/scan-syllabus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: fullText })
      });

      if (!res.ok) throw new Error("Failed to extract tasks");
      
      const extractedTasks = await res.json();
      
      // 5. Bulk save to DB
      const saveRes = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tasks: extractedTasks })
      });

      if (saveRes.ok) {
        showToast(`✨ ${extractedTasks.length} tasks added from your syllabus!`);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      alert("Error scanning syllabus: " + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- DND Handlers ---
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = parseInt(active.id);
    const newStatus = over.id; // 'todo', 'inprogress', 'done'

    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    // Persist to DB
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update status", err);
      fetchTasks(); // rollback on error
    }
  };

  // --- Manual Task Form ---
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ title: '', subject: '', deadline: '', priority: 'Medium', estimatedHours: '' });
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Sort tasks by deadline (nearest first)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline) - new Date(b.deadline);
  });

  const columns = {
    todo: sortedTasks.filter(t => t.status === 'todo'),
    inprogress: sortedTasks.filter(t => t.status === 'inprogress'),
    done: sortedTasks.filter(t => t.status === 'done')
  };

  return (
    <div className="h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <header className="flex items-center justify-between pb-6 border-b border-fa-border mb-6">
        <div>
          <h2 className="text-2xl font-['Sora'] font-bold text-white">Academic Planner</h2>
          <p className="text-fa-text-secondary mt-1">Syllabus scanner & Kanban board.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-fa-brand hover:bg-fa-brand/90 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg shadow-fa-brand/20"
        >
          <Plus size={18} /> Add Task Manually
        </button>
      </header>

      {/* SECTION 1: SYLLABUS SCANNER */}
      <div 
        className="mb-8 relative bg-[#161b22] border-2 border-dashed border-[#6366f1]/40 rounded-xl p-8 text-center transition-all hover:border-[#6366f1]/70 hover:bg-[#6366f1]/5 group cursor-pointer overflow-hidden"
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".pdf" 
          onChange={handleFileUpload}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center animate-in fade-in">
            <Loader2 size={40} className="text-[#6366f1] animate-spin mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Reading Syllabus...</h3>
            <p className="text-sm text-fa-text-secondary">Claude AI is extracting topics and deadlines.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#6366f1]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud size={32} className="text-[#6366f1]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Upload your syllabus — let AI build your study plan</h3>
            <p className="text-sm text-fa-text-secondary">Drag and drop a PDF file, or click to browse.</p>
          </div>
        )}
      </div>

      {/* SECTION 2: KANBAN BOARD */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 pb-6">
          <DroppableColumn id="todo" title="To Do" tasks={columns.todo} />
          <DroppableColumn id="inprogress" title="In Progress" tasks={columns.inprogress} />
          <DroppableColumn id="done" title="Done" tasks={columns.done} />
        </div>
      </DndContext>

      {/* SUCCESS TOAST */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A1E2E] border border-[#6366f1]/30 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} className="text-[#6366f1]" />
          <span className="font-semibold text-sm">{toast}</span>
        </div>
      )}

      {/* MANUAL TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Add Task</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-fa-text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fa-text-secondary mb-1">Task Title</label>
                <input 
                  type="text" required
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#6366f1] focus:outline-none"
                  placeholder="Read Chapter 4"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-fa-text-secondary mb-1">Subject</label>
                  <input 
                    type="text" required
                    value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#6366f1] focus:outline-none"
                    placeholder="e.g. Physics"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-fa-text-secondary mb-1">Deadline</label>
                  <input 
                    type="date" 
                    value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#6366f1] focus:outline-none style-color-scheme-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-fa-text-secondary mb-1">Priority</label>
                  <select 
                    value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#6366f1] focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-fa-text-secondary mb-1">Est. Hours</label>
                  <input 
                    type="number" min="1" max="100"
                    value={form.estimatedHours} onChange={e => setForm({...form, estimatedHours: e.target.value})}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-[#6366f1] focus:outline-none"
                    placeholder="e.g. 2"
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3 bg-[#6366f1] hover:bg-[#6366f1]/90 text-white rounded-xl font-bold mt-2 transition-colors">
                Save Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicPlanner;

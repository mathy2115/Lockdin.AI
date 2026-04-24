import { useState, useEffect, useRef } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  isToday,
  parseISO
} from 'date-fns';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  UploadCloud,
  Loader2,
  Plus,
  CheckCircle2,
  X,
  Brain,
  Trash2,
  ChevronRight,
  Clock,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Target,
  Trophy,
  History,
  Layout
} from 'lucide-react';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// === STYLED COMPONENTS ===

const TaskCard = ({ task, index, onDelete }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-[#1A2236] border border-white/10 rounded-xl p-4 mb-3 transition-all hover:border-fa-brand/50 shadow-sm ${snapshot.isDragging ? 'shadow-2xl shadow-fa-brand/20 border-fa-brand border-2' : ''
            }`}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-fa-brand bg-fa-brand/10 px-2 py-0.5 rounded w-fit uppercase tracking-wider">
                  {task.subject || (task.type === 'revision' ? 'Revision' : 'Study')}
                </span>
                <ChevronRight size={10} className="text-fa-text-muted" />
                <span className="text-[11px] font-bold text-white leading-tight">
                  {task.topic || task.title}
                </span>
              </div>
            </div>
            <button
              onClick={() => onDelete(task.id)}
              className="text-fa-text-muted hover:text-red-400 transition-colors p-1 hover:bg-red-500/10 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="pl-3 border-l border-white/10 mt-1">
            <p className="text-xs text-fa-text-secondary leading-relaxed line-clamp-3">
              {task.subTopic || task.description}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
            <div className="flex gap-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${task.source === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                {task.source === 'ai' ? 'AI Generated' : 'Manual'}
              </span>
              {task.date && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-white/5 text-fa-text-muted">
                  {format(parseISO(task.date), 'dd MMM')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

const Column = ({ id, title, tasks, onDeleteTask }) => {
  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-xl border border-white/5 overflow-hidden min-h-[500px]">
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${id === 'todo' ? 'bg-amber-400' : id === 'inprogress' ? 'bg-blue-400' : 'bg-green-400'
            }`}></div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <span className="text-xs font-bold text-fa-text-muted bg-white/5 px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-fa-brand/5' : ''
              }`}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onDelete={onDeleteTask} />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-32 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-sm text-fa-text-muted">
                No tasks here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

// === MAIN COMPONENT ===

const AcademicPlanner = () => {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('academicTasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeView, setActiveView] = useState('kanban'); // 'kanban' or 'calendar'

  // Planner State
  const [plannerOnboarding, setPlannerOnboarding] = useState(false);
  const [plannerConfig, setPlannerConfig] = useState(() => {
    const saved = localStorage.getItem('planner_config');
    return saved ? JSON.parse(saved) : {
      studyHours: 4,
      examDates: [], // { subject: '', date: '' }
      marks: ''
    };
  });
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState(null);

  const fileInputRef = useRef(null);
  const [manualForm, setManualForm] = useState({ subject: '', topic: '', subTopic: '', date: '' });

  // Persistence
  useEffect(() => {
    localStorage.setItem('academicTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'academicTasks') {
        setTasks(JSON.parse(e.newValue || '[]'));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('planner_config', JSON.stringify(plannerConfig));
  }, [plannerConfig]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- PDF Extraction (Frontend only) ---
  const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) return resolve(window.pdfjsLib);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;

    setIsUploading(true);
    try {
      const pdfjs = await loadPdfJs();

      const arrayBuffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });

      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }

      if (!text.trim()) {
        throw new Error('scanned_pdf');
      }

      setExtractedText(text);
      setPlannerOnboarding(true);
    } catch (err) {
      console.error(err);
      if (err.message === 'scanned_pdf') {
        alert("This PDF appears to be scanned. Please upload a text-based PDF.");
      } else {
        alert("Error reading PDF. Please try again.");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Gemini API Call for Study Plan ---
  const handleGenerateStudyPlan = async () => {
    if (!extractedText.trim()) return;

    setIsAiProcessing(true);
    try {
      const examDatesStr = plannerConfig.examDates
        .filter(ed => ed.subject && ed.date)
        .map(ed => `${ed.subject}: ${ed.date}`)
        .join(', ');

      const prompt = `You are an academic study planner. Given the following syllabus, generate a day-by-day study schedule.\n\nSyllabus: ${extractedText}\nStudy hours per day: ${plannerConfig.studyHours}\nExam dates: ${examDatesStr || 'None'}\nPrevious marks: ${plannerConfig.marks || 'Not provided'}\n\nRules:\n- Prioritize weak topics from previous marks\n- Leave 2 days before each exam as revision days\n- Each day has 1-3 tasks fitting within daily hour limit\n- Return ONLY a valid JSON array. Each object: { id, title, subject, topic, subTopic, date (YYYY-MM-DD), type ('study'|'revision'), column: 'todo' }\n- No explanation, no markdown, just raw JSON array`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');

      const cleaned = text.replace(/```json|```/g, '').trim();

      let newTasks;
      try {
        newTasks = JSON.parse(cleaned);
      } catch (parseErr) {
        throw new Error('invalid_json');
      }

      if (!Array.isArray(newTasks)) {
        throw new Error('invalid_json');
      }

      newTasks = newTasks.map(t => ({
        ...t,
        id: t.id || crypto.randomUUID(),
        status: t.column || 'todo',
        source: 'ai'
      }));

      setTasks(prev => {
        const updated = [...prev, ...newTasks];
        localStorage.setItem('academicTasks', JSON.stringify(updated));
        return updated;
      });
      setPlannerOnboarding(false);
      setExtractedText('');
      setActiveView('kanban'); // Switch to kanban view
      showToast(`📅 Study plan generated with ${newTasks.length} tasks!`);
    } catch (err) {
      console.error(err);
      if (err.message === 'invalid_json') {
        alert("AI response was invalid. Please try again.");
      } else {
        alert("AI Plan Generation failed. Please try again.");
      }
    } finally {
      setIsAiProcessing(false);
    }
  };

  // --- DND Handlers ---
  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const updatedTasks = Array.from(tasks);
    const taskIndex = updatedTasks.findIndex(t => t.id === draggableId);
    const [movedTask] = updatedTasks.splice(taskIndex, 1);

    // Update status based on destination column
    movedTask.status = destination.droppableId;

    // Re-insert at the correct position (or just push if you don't care about order within column)
    // Actually, to keep order within column, we need to handle indexes carefully
    // For simplicity, we'll just update the status and the overall list
    setTasks(prev => {
      const newList = prev.filter(t => t.id !== draggableId);
      // We could insert at a specific index if we tracked column-specific order, 
      // but status-based filtering is easier for now.
      return [...newList, movedTask];
    });
  };

  const handleDeleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleAddManualTask = (e) => {
    e.preventDefault();
    const newTask = {
      ...manualForm,
      id: crypto.randomUUID(),
      status: 'todo',
      source: 'manual',
      type: 'study'
    };
    setTasks(prev => [...prev, newTask]);
    setIsManualModalOpen(false);
    setManualForm({ subject: '', topic: '', subTopic: '', date: '' });
    showToast("Task added successfully!");
  };

  const columns = {
    todo: tasks.filter(t => t.status === 'todo'),
    inprogress: tasks.filter(t => t.status === 'inprogress'),
    done: tasks.filter(t => t.status === 'done')
  };

  return (
    <div className="h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* HEADER */}
      <header className="flex items-center justify-between pb-6 border-b border-fa-border mb-6 flex-shrink-0">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-2xl font-['Sora'] font-bold text-white">Academic Hub</h2>
            <p className="text-fa-text-secondary mt-1 text-sm">Syllabus-driven Planner & Study Schedule.</p>
          </div>

          <div className="flex bg-fa-bg-shell rounded-xl p-1 border border-fa-border ml-4">
            <button
              onClick={() => setActiveView('kanban')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeView === 'kanban' ? 'bg-fa-brand text-white shadow-lg' : 'text-fa-text-secondary hover:text-white'
                }`}
            >
              <Layout size={16} /> Kanban
            </button>
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeView === 'calendar' ? 'bg-fa-brand text-white shadow-lg' : 'text-fa-text-secondary hover:text-white'
                }`}
            >
              <CalendarIcon size={16} /> Calendar
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-fa-bg-shell hover:bg-fa-bg-hover text-white px-4 py-2 rounded-lg font-semibold transition-colors border border-fa-border shadow-sm"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            {isUploading ? 'Reading PDF...' : 'Upload Syllabus'}
          </button>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-2 bg-fa-brand hover:bg-fa-brand/90 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-lg shadow-fa-brand/20"
          >
            <Plus size={18} /> Add Task
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf"
          onChange={handleFileUpload}
        />
      </header>

      {/* MAIN VIEW */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeView === 'kanban' ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
              <Column id="todo" title="To Do" tasks={columns.todo} onDeleteTask={handleDeleteTask} />
              <Column id="inprogress" title="In Progress" tasks={columns.inprogress} onDeleteTask={handleDeleteTask} />
              <Column id="done" title="Done" tasks={columns.done} onDeleteTask={handleDeleteTask} />
            </div>
          </DragDropContext>
        ) : (
          <div className="h-full flex flex-col bg-[#0d1117] rounded-2xl border border-white/5 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-white min-w-[150px]">
                  {format(currentCalendarDate, 'MMMM yyyy')}
                </h3>
                <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 1))}
                    className="p-1.5 hover:bg-white/10 rounded-md text-fa-text-secondary transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentCalendarDate(new Date())}
                    className="px-3 py-1 text-xs font-bold text-white hover:bg-white/10 rounded-md transition-colors border-x border-white/5 mx-1"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 1))}
                    className="p-1.5 hover:bg-white/10 rounded-md text-fa-text-secondary transition-colors"
                  >
                    <ChevronRightIcon size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 border-b border-white/5 h-12 bg-white/[0.01]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-fa-text-muted">
                  {day}
                </div>
              ))}
            </div>

            <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto custom-scrollbar">
              {(() => {
                const start = startOfWeek(startOfMonth(currentCalendarDate));
                const end = endOfWeek(endOfMonth(currentCalendarDate));
                const days = eachDayOfInterval({ start, end });

                return days.map((day) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayTasks = tasks.filter(t => t.date === dayStr);
                  const userExams = plannerConfig.examDates.filter(ed => ed.date === dayStr);

                  return (
                    <div
                      key={dayStr}
                      onClick={() => setSelectedDayTasks({ date: day, tasks: dayTasks, exams: userExams })}
                      className={`min-h-[120px] border-r border-b border-white/5 p-2 transition-all hover:bg-white/[0.03] cursor-pointer group flex flex-col ${!isSameMonth(day, currentCalendarDate) ? 'opacity-30' : ''
                        }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors ${isToday(day) ? 'bg-fa-brand text-white shadow-lg' : 'text-fa-text-secondary group-hover:text-white'
                          }`}>
                          {format(day, 'd')}
                        </span>
                      </div>

                      <div className="space-y-1 overflow-hidden">
                        {/* Exams First */}
                        {userExams.map((exam, i) => (
                          <div key={i} className="bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded truncate flex items-center gap-1 shadow-sm">
                            <Target size={10} /> {exam.subject}
                          </div>
                        ))}

                        {/* Tasks */}
                        {dayTasks.slice(0, 3).map((task) => (
                          <div
                            key={task.id}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded truncate border transition-all ${task.status === 'done'
                              ? 'bg-white/5 border-white/10 text-white/30 line-through'
                              : task.type === 'revision'
                                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                : 'bg-fa-brand/20 border-fa-brand/30 text-fa-brand'
                              }`}
                          >
                            {task.subject || 'Study'} → {task.topic || task.title}
                          </div>
                        ))}

                        {dayTasks.length > 3 && (
                          <div className="text-[8px] font-bold text-fa-text-muted pl-1">
                            + {dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}
      </div>

      {/* PLANNER ONBOARDING MODAL */}
      {plannerOnboarding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="bg-[#1A1E2E] border border-fa-brand/30 rounded-3xl p-8 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-fa-brand/20 rounded-2xl">
                  <CalendarIcon className="text-fa-brand" size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Setup Your Study Plan</h3>
                  <p className="text-sm text-fa-text-secondary">Help AI customize your schedule</p>
                </div>
              </div>
              <button onClick={() => setPlannerOnboarding(false)} className="text-fa-text-muted hover:text-white p-2">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Extracted Text Review */}
              <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                <label className="block text-sm font-bold text-white mb-3">
                  Review Syllabus Content
                </label>
                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-fa-brand outline-none resize-none h-32 custom-scrollbar"
                />
              </div>

              {/* Daily Hours */}
              <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-fa-brand" />
                  Daily Study Capacity
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range" min="1" max="12" step="1"
                    value={plannerConfig.studyHours}
                    onChange={(e) => setPlannerConfig({ ...plannerConfig, studyHours: parseInt(e.target.value) })}
                    className="flex-1 accent-fa-brand h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-2xl font-black text-fa-brand min-w-[50px]">{plannerConfig.studyHours}h</span>
                </div>
                <p className="text-[10px] text-fa-text-muted mt-2 uppercase tracking-wider font-bold">Recommended: 4–6 hours for deep focus</p>
              </div>

              {/* Exam Dates */}
              <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-bold text-white flex items-center gap-2">
                    <Target size={16} className="text-red-400" />
                    Upcoming Exam Dates
                  </label>
                  <button
                    onClick={() => setPlannerConfig({
                      ...plannerConfig,
                      examDates: [...plannerConfig.examDates, { subject: '', date: '' }]
                    })}
                    className="text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1 rounded-full border border-white/10 transition-colors uppercase tracking-widest"
                  >
                    + Add Exam
                  </button>
                </div>

                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                  {plannerConfig.examDates.map((exam, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2">
                      <input
                        type="text" placeholder="Subject Name"
                        value={exam.subject}
                        onChange={(e) => {
                          const newExams = [...plannerConfig.examDates];
                          newExams[idx].subject = e.target.value;
                          setPlannerConfig({ ...plannerConfig, examDates: newExams });
                        }}
                        className="col-span-6 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-fa-brand outline-none"
                      />
                      <input
                        type="date"
                        value={exam.date}
                        onChange={(e) => {
                          const newExams = [...plannerConfig.examDates];
                          newExams[idx].date = e.target.value;
                          setPlannerConfig({ ...plannerConfig, examDates: newExams });
                        }}
                        className="col-span-5 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-fa-brand outline-none [color-scheme:dark]"
                      />
                      <button
                        onClick={() => {
                          const newExams = plannerConfig.examDates.filter((_, i) => i !== idx);
                          setPlannerConfig({ ...plannerConfig, examDates: newExams });
                        }}
                        className="col-span-1 flex items-center justify-center text-fa-text-muted hover:text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {plannerConfig.examDates.length === 0 && (
                    <div className="text-center py-4 border-2 border-dashed border-white/5 rounded-xl text-xs text-fa-text-muted italic">
                      No exams added yet
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Marks */}
              <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                <label className="block text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <History size={16} className="text-amber-400" />
                  Academic History (Optional)
                </label>
                <textarea
                  placeholder="e.g. Maths: 45/100, Physics: 60/100. This helps AI prioritize topics."
                  value={plannerConfig.marks}
                  onChange={(e) => setPlannerConfig({ ...plannerConfig, marks: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-fa-brand outline-none resize-none h-24 custom-scrollbar"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setPlannerOnboarding(false)}
                className="flex-1 py-4 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all text-sm uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateStudyPlan}
                disabled={isAiProcessing}
                className="flex-[2] py-4 bg-fa-brand hover:bg-fa-brand/90 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-2xl shadow-fa-brand/40 text-sm uppercase tracking-widest"
              >
                {isAiProcessing ? <Loader2 size={20} className="animate-spin" /> : <Brain size={20} />}
                {isAiProcessing ? 'Generating study plan with AI...' : 'Generate Study Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAY DETAIL MODAL */}
      {selectedDayTasks && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-end animate-in fade-in duration-200" onClick={() => setSelectedDayTasks(null)}>
          <div
            className="w-full max-w-md h-full bg-[#1A1E2E] border-l border-white/10 p-8 shadow-2xl animate-in slide-in-from-right duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-white">{format(selectedDayTasks.date, 'eeee')}</h3>
                <p className="text-fa-brand font-bold uppercase tracking-widest text-xs mt-1">{format(selectedDayTasks.date, 'MMMM d, yyyy')}</p>
              </div>
              <button onClick={() => setSelectedDayTasks(null)} className="p-2 hover:bg-white/5 rounded-full text-fa-text-muted transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-4 custom-scrollbar">
              {/* Exams Section */}
              {selectedDayTasks.exams.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} /> Critical Exams
                  </h4>
                  {selectedDayTasks.exams.map((exam, idx) => (
                    <div key={idx} className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/20 rounded-xl">
                          <Trophy size={20} className="text-red-400" />
                        </div>
                        <span className="font-bold text-white text-lg">{exam.subject}</span>
                      </div>
                      <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Today</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-fa-brand uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={14} /> Scheduled Tasks
                </h4>
                {selectedDayTasks.tasks.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl text-fa-text-muted">
                    <div className="p-4 bg-white/5 rounded-full mb-4">
                      <CalendarIcon size={32} />
                    </div>
                    <p className="font-bold text-sm">No tasks scheduled for today</p>
                  </div>
                ) : (
                  selectedDayTasks.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-5 rounded-2xl border transition-all hover:scale-[1.02] ${task.status === 'done' ? 'bg-white/[0.02] border-white/10 opacity-60' :
                        task.type === 'revision'
                          ? 'bg-amber-500/5 border-amber-500/10'
                          : 'bg-fa-brand/5 border-fa-brand/10'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${task.status === 'done' ? 'bg-green-500/20 text-green-400' :
                              task.status === 'inprogress' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-white/10 text-fa-text-secondary'
                              }`}>
                              {task.status || 'todo'}
                            </span>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-white/5 text-fa-text-muted border border-white/5`}>
                              {task.source === 'ai' ? 'AI-Generated' : 'Manual'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-fa-text-muted">
                          <Clock size={12} />
                          <span className="text-xs font-bold">{task.estimatedHours || 1}h</span>
                        </div>
                      </div>

                      <h5 className="text-white font-bold text-lg mb-1 leading-tight">{task.subject || 'Untitled Subject'}</h5>
                      <p className="text-fa-brand text-sm font-bold mb-3">{task.topic || task.title}</p>

                      {task.subTopic && (
                        <div className="pl-3 border-l-2 border-white/5">
                          <p className="text-xs text-fa-text-secondary leading-relaxed">{task.subTopic}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedDayTasks(null)}
              className="w-full py-4 mt-8 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all uppercase tracking-widest text-xs"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}

      {/* MANUAL TASK MODAL */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#161b22] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Add Manual Task</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-fa-text-muted hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddManualTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-fa-text-secondary mb-1">Subject Name</label>
                <input
                  type="text" required
                  value={manualForm.subject} onChange={e => setManualForm({ ...manualForm, subject: e.target.value })}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-fa-brand focus:outline-none"
                  placeholder="e.g. Mathematics"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fa-text-secondary mb-1">Topic</label>
                <input
                  type="text" required
                  value={manualForm.topic} onChange={e => setManualForm({ ...manualForm, topic: e.target.value })}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-fa-brand focus:outline-none"
                  placeholder="e.g. Calculus"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fa-text-secondary mb-1">Sub Topic</label>
                <input
                  type="text" required
                  value={manualForm.subTopic} onChange={e => setManualForm({ ...manualForm, subTopic: e.target.value })}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-fa-brand focus:outline-none"
                  placeholder="e.g. Integration by Parts"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-fa-text-secondary mb-1">Schedule Date (Optional)</label>
                <input
                  type="date"
                  value={manualForm.date} onChange={e => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-fa-brand focus:outline-none [color-scheme:dark]"
                />
              </div>

              <button type="submit" className="w-full py-3 bg-fa-brand hover:bg-fa-brand/90 text-white rounded-xl font-bold mt-2 transition-colors shadow-lg shadow-fa-brand/20">
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-fa-brand border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={18} />
          <span className="font-semibold text-sm">{toast}</span>
        </div>
      )}
    </div>
  );
};

export default AcademicPlanner;

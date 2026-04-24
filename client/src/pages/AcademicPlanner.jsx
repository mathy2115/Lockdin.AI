import React, { useState, useRef } from 'react';
import { BookOpen, Calendar, Clock, AlertCircle, CheckCircle2, Loader2, UploadCloud, FileText, X, Plus, Minus } from 'lucide-react';

const AcademicPlanner = () => {
  const [planTitle, setPlanTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [syllabusText, setSyllabusText] = useState('');
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(2);
  const [sessionLengthType, setSessionLengthType] = useState('25'); // '25', '50', 'Custom'
  const [sessionLengthMins, setSessionLengthMins] = useState(25);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      // Mocking text extraction for demo purposes
      if (!syllabusText) {
        setSyllabusText(`[Content from ${file.name}]`);
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGeneratePlan = async () => {
    if (!syllabusText.trim() && !uploadedFile) {
      setError('Please upload a file or paste your syllabus text.');
      return;
    }

    setLoading(true);
    setError(null);
    
    // Combine title and deadline into the text so the AI knows
    const contextPrefix = `Plan Title: ${planTitle || 'Untitled'}\nTarget Deadline: ${deadline || 'None specified'}\n\n`;
    const finalSyllabusText = contextPrefix + syllabusText;

    const actualSessionLength = sessionLengthType === 'Custom' ? sessionLengthMins : parseInt(sessionLengthType, 10);

    try {
      const response = await fetch('http://localhost:5000/api/ai/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusText: finalSyllabusText,
          currentDate: new Date().toISOString().split('T')[0],
          studyHoursPerDay,
          sessionLengthMins: actualSessionLength
        }),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to generate study plan. Please try again.';
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch (e) {
          // Fallback if the response isn't JSON
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setPlan(data);
    } catch (err) {
      console.error('Frontend Error - Failed to generate plan:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      <header className="flex items-center justify-between pb-6 mb-6 border-b border-fa-border flex-shrink-0">
        <div>
          <h2 className="text-2xl font-['Sora'] font-bold text-fa-text-primary">AI Academic Planner</h2>
          <p className="text-fa-text-secondary mt-1">Transform your syllabus into a backwards-planned study schedule.</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col lg:flex-row gap-6 pb-8">
        
        {/* Left Column: Input Form */}
        <div className="w-full lg:w-[40%] flex flex-col gap-6">
          <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-6 shadow-lg relative overflow-hidden group">
            {/* Subtle gradient background for premium feel */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fa-brand to-purple-600 opacity-80"></div>
            
            <div className="space-y-6">
              
              {/* 1. Plan Title */}
              <div>
                <label className="block text-sm font-semibold text-fa-text-primary mb-1.5">Plan Title</label>
                <input 
                  type="text" 
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="e.g. Physics Finals, Math Midterm..."
                  className="w-full bg-fa-bg-page border border-fa-border rounded-xl p-3 text-sm text-fa-text-primary placeholder:text-fa-text-muted focus:outline-none focus:border-fa-brand focus:ring-1 focus:ring-fa-brand transition-all shadow-inner"
                />
              </div>

              {/* 2. Deadline */}
              <div>
                <label className="block text-sm font-semibold text-fa-text-primary mb-1.5">When do you need to be ready by?</label>
                <input 
                  type="date" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-fa-bg-page border border-fa-border rounded-xl p-3 text-sm text-fa-text-primary focus:outline-none focus:border-fa-brand focus:ring-1 focus:ring-fa-brand transition-all shadow-inner"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {/* 3. Upload Study Materials */}
              <div>
                <label className="block text-sm font-semibold text-fa-text-primary mb-1">Upload your syllabus, notes, or any study material</label>
                <p className="text-xs text-fa-text-secondary mb-3">We'll read it and build your plan around it.</p>
                
                <div className="relative group cursor-pointer">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.txt"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Drag and drop or click to upload"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${uploadedFile ? 'border-fa-brand bg-fa-brand/5' : 'border-fa-border bg-fa-bg-page group-hover:border-fa-brand/50 group-hover:bg-fa-bg-hover'}`}>
                    {uploadedFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={32} className="text-fa-brand" />
                        <span className="text-sm font-medium text-fa-text-primary truncate max-w-[200px]">{uploadedFile.name}</span>
                        <span className="text-xs text-fa-brand mt-1 flex items-center gap-1 z-20 cursor-pointer hover:underline" onClick={(e) => { e.preventDefault(); removeFile(); }}>
                          <X size={12} /> Remove
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-fa-text-muted group-hover:text-fa-text-secondary transition-colors">
                        <UploadCloud size={32} className="mb-1" />
                        <span className="text-sm font-medium">Drag & drop your file here</span>
                        <span className="text-xs">Accepts PDF, DOCX, TXT</span>
                      </div>
                    )}
                  </div>
                </div>

                {!uploadedFile && (
                  <div className="mt-4 animate-fade-in">
                    <label className="block text-xs font-medium text-fa-text-secondary mb-2">Or paste your content here...</label>
                    <textarea 
                      value={syllabusText}
                      onChange={(e) => setSyllabusText(e.target.value)}
                      placeholder="Paste topics, deadlines, weightage..."
                      className="w-full h-32 bg-fa-bg-page border border-fa-border rounded-xl p-3 text-sm text-fa-text-primary placeholder:text-fa-text-muted focus:outline-none focus:border-fa-brand focus:ring-1 focus:ring-fa-brand resize-none custom-scrollbar shadow-inner transition-all"
                    />
                  </div>
                )}
              </div>

              {/* 4 & 5. Hours and Session Length */}
              <div className="grid grid-cols-2 gap-5">
                {/* Daily Study Hours */}
                <div>
                  <label className="block text-sm font-semibold text-fa-text-primary mb-2">Daily Study Hours</label>
                  <div className="flex items-center bg-fa-bg-page border border-fa-border rounded-xl overflow-hidden shadow-inner focus-within:border-fa-brand focus-within:ring-1 focus-within:ring-fa-brand transition-all">
                    <button 
                      type="button"
                      onClick={() => setStudyHoursPerDay(Math.max(1, studyHoursPerDay - 1))}
                      className="p-3 text-fa-text-secondary hover:text-white hover:bg-fa-bg-hover transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <input 
                      type="number" 
                      value={studyHoursPerDay}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) setStudyHoursPerDay(Math.min(12, Math.max(1, val)));
                      }}
                      className="w-full bg-transparent text-center text-sm font-medium text-fa-text-primary focus:outline-none appearance-none m-0"
                      style={{ MozAppearance: 'textfield' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setStudyHoursPerDay(Math.min(12, studyHoursPerDay + 1))}
                      className="p-3 text-fa-text-secondary hover:text-white hover:bg-fa-bg-hover transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Session Length */}
                <div>
                  <label className="block text-sm font-semibold text-fa-text-primary mb-2">Session Length</label>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1.5 bg-fa-bg-page border border-fa-border p-1 rounded-xl shadow-inner">
                      {['25', '50', 'Custom'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setSessionLengthType(opt)}
                          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${sessionLengthType === opt ? 'bg-fa-bg-hover text-white shadow-sm' : 'text-fa-text-secondary hover:text-white'}`}
                        >
                          {opt === 'Custom' ? opt : `${opt}m`}
                        </button>
                      ))}
                    </div>
                    {sessionLengthType === 'Custom' && (
                      <input 
                        type="number" 
                        value={sessionLengthMins}
                        onChange={(e) => setSessionLengthMins(Number(e.target.value))}
                        min="15"
                        max="120"
                        placeholder="Mins"
                        className="w-full bg-fa-bg-page border border-fa-border rounded-xl p-2 text-sm text-center text-fa-text-primary focus:outline-none focus:border-fa-brand focus:ring-1 focus:ring-fa-brand transition-all shadow-inner animate-fade-in"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm flex items-start gap-3 animate-fade-in shadow-sm">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button 
                onClick={handleGeneratePlan}
                disabled={loading}
                className="w-full bg-fa-brand hover:bg-fa-brand/90 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-fa-brand/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:shadow-none active:scale-[0.99]"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Calendar size={20} />}
                {loading ? 'Crafting Your Schedule...' : 'Generate Study Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="w-full lg:w-[60%] flex flex-col gap-6">
          {!plan && !loading ? (
            <div className="flex-1 bg-fa-bg-shell border border-fa-border border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-12 min-h-[500px]">
              <div className="w-20 h-20 rounded-full bg-fa-bg-hover flex items-center justify-center mb-6 shadow-inner">
                <Calendar size={32} className="text-fa-text-muted" />
              </div>
              <h3 className="text-xl font-bold text-fa-text-primary mb-3">No Plan Generated Yet</h3>
              <p className="text-fa-text-secondary max-w-sm leading-relaxed">
                Fill out the details on the left and hit generate. We'll automatically build a backwards-planned timeline so you hit your deadline stress-free.
              </p>
            </div>
          ) : loading ? (
             <div className="flex-1 bg-fa-bg-shell border border-fa-border rounded-2xl flex flex-col items-center justify-center text-center p-12 min-h-[500px] shadow-sm">
              <div className="relative mb-6">
                <div className="absolute inset-0 border-4 border-fa-brand/20 rounded-full"></div>
                <Loader2 size={48} className="text-fa-brand animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-fa-text-primary mb-2">Analyzing Materials...</h3>
              <p className="text-sm text-fa-text-secondary animate-pulse">Mapping out your optimal study path</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Course Info & Time Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-fa-brand/5 rounded-bl-[100px] -z-0"></div>
                  <h4 className="text-xs font-bold text-fa-text-muted uppercase tracking-wider mb-4">Course Details</h4>
                  <div className="font-['Sora'] text-xl font-bold text-fa-text-primary mb-1 relative z-10">{plan.course_info?.course_name || planTitle || 'Your Plan'}</div>
                  <div className="text-sm text-fa-text-secondary relative z-10">{plan.course_info?.course_code} • {plan.course_info?.semester}</div>
                  {plan.course_info?.instructor && (
                    <div className="text-xs text-fa-text-muted mt-2 relative z-10">Instructor: {plan.course_info?.instructor}</div>
                  )}
                </div>

                <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-6 shadow-sm">
                  <h4 className="text-xs font-bold text-fa-text-muted uppercase tracking-wider mb-4">Time Investment</h4>
                  <div className="flex items-end gap-3 mb-3">
                    <span className="text-3xl font-bold text-white leading-none">{plan.time_breakdown?.total_study_hours_needed || 0}</span>
                    <span className="text-sm text-fa-text-secondary mb-1">hrs total needed</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-fa-text-secondary">Average pace:</span>
                    <span className="font-medium text-fa-text-primary">{plan.time_breakdown?.hours_per_week_avg} hrs/wk</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-fa-text-secondary">Crunch week:</span>
                    <span className="font-medium text-orange-400">{plan.time_breakdown?.peak_week}</span>
                  </div>
                </div>
              </div>

              {/* Study Tips */}
              {plan.study_tips && plan.study_tips.length > 0 && (
                <div className="bg-gradient-to-r from-fa-brand/10 to-transparent border border-fa-brand/20 rounded-2xl p-6 shadow-sm">
                  <h4 className="text-sm font-bold text-fa-brand flex items-center gap-2 mb-4">
                    <AlertCircle size={18} /> Strategic Advice
                  </h4>
                  <ul className="space-y-3">
                    {plan.study_tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-fa-text-primary flex items-start gap-3">
                        <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-fa-brand"></span>
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Deadlines */}
              {plan.extracted_deadlines && plan.extracted_deadlines.length > 0 && (
                <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-6 shadow-sm">
                  <h4 className="text-sm font-bold text-fa-text-primary mb-5 flex items-center gap-2">
                    <Clock size={18} className="text-fa-text-muted" /> Key Deadlines
                  </h4>
                  <div className="space-y-3">
                    {plan.extracted_deadlines.map((deadline, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center bg-fa-bg-page rounded-xl p-4 border border-fa-border hover:border-fa-brand/30 transition-colors gap-3">
                        <div>
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md tracking-wider ${deadline.type === 'exam' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-fa-brand/10 text-fa-brand border border-fa-brand/20'}`}>
                              {deadline.type}
                            </span>
                            <span className="text-sm font-bold text-white">{deadline.title}</span>
                          </div>
                          <div className="text-xs text-fa-text-secondary truncate max-w-sm">{deadline.topics_covered?.join(', ')}</div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto">
                          <div className="text-sm font-bold text-fa-text-primary bg-fa-bg-hover px-3 py-1 rounded-lg">{deadline.due_date || deadline.exam_date}</div>
                          {deadline.weightage && <div className="text-xs font-medium text-fa-text-muted mt-1">{deadline.weightage}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Schedule Timeline */}
              {plan.study_schedule && plan.study_schedule.length > 0 && (
                <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-6 shadow-sm">
                  <h4 className="text-sm font-bold text-fa-text-primary mb-8 flex items-center gap-2">
                    <Calendar size={18} className="text-fa-text-muted" /> Daily Action Plan
                  </h4>
                  
                  <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-px before:bg-gradient-to-b before:from-fa-brand/50 before:via-fa-border before:to-transparent">
                    {plan.study_schedule.map((day, dayIdx) => (
                      <div key={dayIdx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Timeline Node */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-fa-brand bg-fa-bg-page text-fa-brand shadow-[0_0_15px_rgba(111,76,255,0.2)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <span className="text-[10px] font-bold">{day.date.split('-')[2]}</span>
                        </div>
                        
                        {/* Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border border-fa-border bg-fa-bg-page shadow-sm hover:border-fa-brand/30 transition-colors">
                          <div className="flex items-center justify-between mb-4 pb-3 border-b border-fa-border/50">
                             <div className="font-bold text-fa-text-primary text-sm flex items-center gap-2">
                               {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                             </div>
                          </div>
                          
                          <div className="space-y-4">
                            {day.tasks.map((task, taskIdx) => (
                              <div key={taskIdx} className="flex flex-col gap-1.5 group/task">
                                <div className="flex items-start justify-between">
                                  <span className="text-sm font-medium text-fa-text-primary flex items-start gap-2">
                                    <CheckCircle2 size={16} className="mt-0.5 text-fa-border group-hover/task:text-fa-brand transition-colors flex-shrink-0" />
                                    <span className="leading-tight">{task.task_title}</span>
                                  </span>
                                  <span className="text-xs font-bold bg-fa-bg-hover text-fa-text-secondary px-2 py-1 rounded-md ml-3 whitespace-nowrap border border-fa-border/50">
                                    {task.duration_mins}m
                                  </span>
                                </div>
                                {task.notes && (
                                  <span className="text-xs text-fa-text-muted ml-6 leading-relaxed border-l-2 border-fa-border pl-2">{task.notes}</span>
                                )}
                                {task.priority === 'High' && (
                                  <span className="text-[10px] text-red-400 font-bold ml-6 uppercase tracking-wider bg-red-500/10 px-1.5 py-0.5 rounded w-fit">High Priority</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicPlanner;

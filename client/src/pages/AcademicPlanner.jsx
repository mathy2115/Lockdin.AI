import React, { useState } from 'react';
import { BookOpen, Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';

const AcademicPlanner = () => {
  const [syllabusText, setSyllabusText] = useState('');
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(2);
  const [sessionLengthMins, setSessionLengthMins] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);

  const handleGeneratePlan = async () => {
    if (!syllabusText.trim()) {
      setError('Please paste your syllabus text first.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/ai/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabusText,
          currentDate: new Date().toISOString().split('T')[0],
          studyHoursPerDay,
          sessionLengthMins
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate study plan. Please try again.');
      }

      const data = await response.json();
      setPlan(data);
    } catch (err) {
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
          <div className="bg-fa-bg-shell border border-fa-border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-fa-text-primary mb-4 flex items-center gap-2">
              <BookOpen size={20} className="text-fa-brand" />
              Syllabus Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-fa-text-secondary mb-1">Paste Syllabus Text</label>
                <textarea 
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder="Paste topics, deadlines, weightage, and readings from your syllabus here..."
                  className="w-full h-64 bg-fa-bg-page border border-fa-border rounded-lg p-3 text-sm text-fa-text-primary focus:outline-none focus:border-fa-brand resize-none custom-scrollbar"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-fa-text-secondary mb-1">Daily Study Hours</label>
                  <input 
                    type="number" 
                    value={studyHoursPerDay}
                    onChange={(e) => setStudyHoursPerDay(Number(e.target.value))}
                    min="1"
                    max="12"
                    className="w-full bg-fa-bg-page border border-fa-border rounded-lg p-2.5 text-sm text-fa-text-primary focus:outline-none focus:border-fa-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-fa-text-secondary mb-1">Session Length (mins)</label>
                  <input 
                    type="number" 
                    value={sessionLengthMins}
                    onChange={(e) => setSessionLengthMins(Number(e.target.value))}
                    step="5"
                    min="15"
                    max="120"
                    className="w-full bg-fa-bg-page border border-fa-border rounded-lg p-2.5 text-sm text-fa-text-primary focus:outline-none focus:border-fa-brand"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button 
                onClick={handleGeneratePlan}
                disabled={loading}
                className="w-full bg-fa-brand hover:bg-fa-brand/90 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Calendar size={20} />}
                {loading ? 'Analyzing Syllabus...' : 'Generate Study Plan'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="w-full lg:w-[60%] flex flex-col gap-6">
          {!plan && !loading ? (
            <div className="flex-1 bg-fa-bg-shell border border-fa-border border-dashed rounded-xl flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
              <Calendar size={48} className="text-fa-border mb-4" />
              <h3 className="text-xl font-semibold text-fa-text-primary mb-2">No Plan Generated Yet</h3>
              <p className="text-fa-text-secondary max-w-sm">
                Paste your syllabus on the left and hit generate. The AI will create a backwards-planned schedule specifically for you.
              </p>
            </div>
          ) : loading ? (
             <div className="flex-1 bg-fa-bg-shell border border-fa-border rounded-xl flex flex-col items-center justify-center text-center p-12 min-h-[400px]">
              <Loader2 size={40} className="text-fa-brand animate-spin mb-4" />
              <h3 className="text-lg font-medium text-fa-text-primary animate-pulse">Crafting your schedule...</h3>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Course Info & Time Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-fa-bg-shell border border-fa-border rounded-xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-fa-text-muted uppercase tracking-wider mb-3">Course Info</h4>
                  <div className="font-['Sora'] text-xl font-bold text-fa-brand mb-1">{plan.course_info?.course_name || 'Course Name'}</div>
                  <div className="text-sm text-fa-text-primary">{plan.course_info?.course_code} • {plan.course_info?.semester}</div>
                  <div className="text-sm text-fa-text-secondary mt-1">Instructor: {plan.course_info?.instructor}</div>
                </div>

                <div className="bg-fa-bg-shell border border-fa-border rounded-xl p-5 shadow-sm">
                  <h4 className="text-xs font-bold text-fa-text-muted uppercase tracking-wider mb-3">Time Breakdown</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-fa-text-secondary" />
                    <span className="text-sm text-fa-text-primary"><strong className="text-white">{plan.time_breakdown?.total_study_hours_needed}</strong> hrs total needed</span>
                  </div>
                  <div className="text-sm text-fa-text-secondary mb-1">Avg: {plan.time_breakdown?.hours_per_week_avg} hrs/week</div>
                  <div className="text-xs text-orange-400 mt-2">Peak: {plan.time_breakdown?.peak_week}</div>
                </div>
              </div>

              {/* Study Tips */}
              {plan.study_tips && plan.study_tips.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2 mb-3">
                    <AlertCircle size={16} /> Strategic Advice
                  </h4>
                  <ul className="space-y-2">
                    {plan.study_tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-blue-100 flex items-start gap-2">
                        <span className="mt-1 flex-shrink-0 text-blue-400">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Extracted Deadlines */}
              {plan.extracted_deadlines && plan.extracted_deadlines.length > 0 && (
                <div className="bg-fa-bg-shell border border-fa-border rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-fa-text-primary mb-4 border-b border-fa-border pb-2">Key Deadlines</h4>
                  <div className="space-y-3">
                    {plan.extracted_deadlines.map((deadline, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-fa-bg-page rounded-lg p-3 border border-fa-border/50">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${deadline.type === 'exam' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'}`}>
                              {deadline.type}
                            </span>
                            <span className="text-sm font-medium text-fa-text-primary">{deadline.title}</span>
                          </div>
                          <div className="text-xs text-fa-text-secondary truncate max-w-xs">{deadline.topics_covered?.join(', ')}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-fa-brand">{deadline.due_date || deadline.exam_date}</div>
                          <div className="text-xs text-fa-text-muted">{deadline.weightage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Study Schedule Timeline */}
              {plan.study_schedule && plan.study_schedule.length > 0 && (
                <div className="bg-fa-bg-shell border border-fa-border rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-fa-text-primary mb-6">Your Daily Schedule</h4>
                  
                  <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-fa-border before:to-transparent">
                    {plan.study_schedule.map((day, dayIdx) => (
                      <div key={dayIdx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-fa-border bg-fa-bg-page text-fa-brand shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <Calendar size={16} />
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-fa-border bg-fa-bg-page shadow">
                          <div className="flex items-center justify-between mb-3 border-b border-fa-border pb-2">
                             <div className="font-semibold text-fa-brand text-sm">{day.date}</div>
                          </div>
                          
                          <div className="space-y-3">
                            {day.tasks.map((task, taskIdx) => (
                              <div key={taskIdx} className="flex flex-col gap-1">
                                <div className="flex items-start justify-between">
                                  <span className="text-sm font-medium text-fa-text-primary flex items-start gap-1">
                                    <CheckCircle2 size={14} className="mt-0.5 text-fa-text-muted flex-shrink-0" />
                                    {task.task_title}
                                  </span>
                                  <span className="text-xs font-semibold bg-fa-bg-hover text-fa-text-secondary px-2 py-1 rounded ml-2 whitespace-nowrap">
                                    {task.duration_mins}m
                                  </span>
                                </div>
                                <span className="text-xs text-fa-text-muted ml-5">{task.notes}</span>
                                {task.priority === 'High' && (
                                  <span className="text-[10px] text-red-400 font-semibold ml-5 uppercase">High Priority</span>
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

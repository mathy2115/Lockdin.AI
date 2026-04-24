import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    grade: '',
    studyMode: 'cam',
    stressLevel: 5,
    bestTime: '',
    midSessionFeeling: '',
    focusKillers: [],
    breakPreference: '',
    additionalInfo: ''
  });

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleFocusKiller = (killer) => {
    setFormData(prev => {
      const exists = prev.focusKillers.includes(killer);
      if (exists) {
        return { ...prev, focusKillers: prev.focusKillers.filter(k => k !== killer) };
      }
      return { ...prev, focusKillers: [...prev.focusKillers, killer] };
    });
  };

  const handleComplete = () => {
    localStorage.setItem('userProfile', JSON.stringify(formData));
    localStorage.setItem('onboardingDone', 'true');
    navigate('/dashboard');
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const renderProgressBar = () => (
    <div className="w-full mb-8">
      <div className="h-1 w-full bg-fa-bg-shell rounded-full overflow-hidden">
        <div 
          className="h-full bg-fa-brand transition-all duration-500 ease-out"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-fa-text-muted text-right">Step {step} of 4</div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-fa-bg-page px-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="w-full max-w-2xl">
        {renderProgressBar()}
        
        <div className="bg-fa-bg-shell border border-fa-border rounded-2xl p-8 shadow-2xl shadow-fa-brand/5 transition-all duration-300">
          
          {/* STEP 1: Basic Info */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="font-['Sora'] text-2xl font-bold text-fa-text-primary mb-6">Let's start with the basics</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-fa-text-secondary mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateForm('fullName', e.target.value)}
                    className="w-full px-4 py-3 bg-fa-bg-page border border-fa-border rounded-xl text-fa-text-primary focus:outline-none focus:border-fa-brand transition-colors"
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-fa-text-secondary mb-2">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => updateForm('age', e.target.value)}
                      className="w-full px-4 py-3 bg-fa-bg-page border border-fa-border rounded-xl text-fa-text-primary focus:outline-none focus:border-fa-brand transition-colors"
                      placeholder="18"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-fa-text-secondary mb-2">Grade / Year</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => updateForm('grade', e.target.value)}
                      className="w-full px-4 py-3 bg-fa-bg-page border border-fa-border rounded-xl text-fa-text-primary focus:outline-none focus:border-fa-brand transition-colors appearance-none"
                    >
                      <option value="">Select...</option>
                      <option value="High School Year 1">High School Year 1</option>
                      <option value="High School Year 2">High School Year 2</option>
                      <option value="High School Year 3">High School Year 3</option>
                      <option value="High School Year 4">High School Year 4</option>
                      <option value="College Year 1">College Year 1</option>
                      <option value="College Year 2">College Year 2</option>
                      <option value="College Year 3">College Year 3</option>
                      <option value="College Year 4">College Year 4</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Study Personality */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="font-['Sora'] text-2xl font-bold text-fa-text-primary mb-6">Let's get to know how you study</h2>
              <div className="space-y-8">
                
                {/* Stress Slider */}
                <div>
                  <label className="block text-sm font-medium text-fa-text-secondary mb-4">On a scale of 1–10, how often do you feel stressed while studying?</label>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-fa-text-muted">Rarely</span>
                    <input 
                      type="range" min="1" max="10" 
                      value={formData.stressLevel} 
                      onChange={(e) => updateForm('stressLevel', e.target.value)}
                      className="flex-1 accent-fa-brand h-2 bg-fa-bg-page rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-fa-text-muted">Always</span>
                  </div>
                  <div className="text-center mt-2 text-fa-brand font-semibold">{formData.stressLevel}</div>
                </div>

                {/* Best Time Pills */}
                <div>
                  <label className="block text-sm font-medium text-fa-text-secondary mb-3">What time of day do you study best?</label>
                  <div className="flex flex-wrap gap-2">
                    {['Morning', 'Afternoon', 'Evening', 'Late Night'].map(time => (
                      <button
                        key={time}
                        onClick={() => updateForm('bestTime', time)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                          formData.bestTime === time
                            ? 'bg-fa-brand border-fa-brand text-white'
                            : 'bg-transparent border-fa-border text-fa-text-secondary hover:border-fa-text-muted'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mid-Session Feeling Emojis */}
                <div>
                  <label className="block text-sm font-medium text-fa-text-secondary mb-3">How do you usually feel mid-session?</label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { emoji: '😤', label: 'Frustrated' },
                      { emoji: '😴', label: 'Tired' },
                      { emoji: '😰', label: 'Anxious' },
                      { emoji: '😐', label: 'Neutral' },
                      { emoji: '😊', label: 'Good' }
                    ].map(feel => (
                      <button
                        key={feel.label}
                        onClick={() => updateForm('midSessionFeeling', feel.label)}
                        className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                          formData.midSessionFeeling === feel.label
                            ? 'bg-fa-brand/10 border-fa-brand'
                            : 'bg-fa-bg-page border-fa-border hover:border-fa-text-muted'
                        }`}
                      >
                        <span className="text-2xl mb-1">{feel.emoji}</span>
                        <span className="text-xs text-fa-text-secondary">{feel.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Killers Multi-select */}
                <div>
                  <label className="block text-sm font-medium text-fa-text-secondary mb-3">What kills your focus the most?</label>
                  <div className="flex flex-wrap gap-2">
                    {['Phone', 'Noise', 'Hunger', 'Social Media', 'Fatigue', 'My own thoughts'].map(killer => {
                      const isSelected = formData.focusKillers.includes(killer);
                      return (
                        <button
                          key={killer}
                          onClick={() => toggleFocusKiller(killer)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border flex items-center space-x-1 ${
                            isSelected
                              ? 'bg-fa-brand border-fa-brand text-white'
                              : 'bg-transparent border-fa-border text-fa-text-secondary hover:border-fa-text-muted'
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                          <span>{killer}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Break Preference */}
                <div>
                  <label className="block text-sm font-medium text-fa-text-secondary mb-3">How do you prefer to be reminded to take breaks?</label>
                  <div className="flex flex-wrap gap-2">
                    {['Gentle nudge', 'Firm reminder', 'Don\'t remind me'].map(pref => (
                      <button
                        key={pref}
                        onClick={() => updateForm('breakPreference', pref)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                          formData.breakPreference === pref
                            ? 'bg-fa-brand border-fa-brand text-white'
                            : 'bg-transparent border-fa-border text-fa-text-secondary hover:border-fa-text-muted'
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: About You */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <h2 className="font-['Sora'] text-2xl font-bold text-fa-text-primary mb-2">Anything else?</h2>
              <p className="text-fa-text-secondary mb-6">Tell us anything else you want lockdin.ai to know about you. (Optional)</p>
              
              <textarea
                value={formData.additionalInfo}
                onChange={(e) => updateForm('additionalInfo', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-fa-bg-page border border-fa-border rounded-xl text-fa-text-primary focus:outline-none focus:border-fa-brand transition-colors resize-none mb-4"
                placeholder="e.g. I have exams every Friday, I work best with lo-fi music, I tend to procrastinate after 10pm..."
              />
            </div>
          )}

          {/* STEP 4: Completion */}
          {step === 4 && (
            <div className="animate-in zoom-in duration-500 text-center py-8">
              <div className="w-20 h-20 bg-fa-brand/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-fa-brand" />
              </div>
              <h2 className="font-['Sora'] text-3xl font-bold text-fa-text-primary mb-4">
                You're all set, {formData.fullName.split(' ')[0] || 'there'}.
              </h2>
              <p className="text-fa-text-secondary mb-10 text-lg">
                Let's get to work and crush those goals.
              </p>
              <button
                onClick={handleComplete}
                className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl shadow-lg shadow-fa-brand/20 text-base font-medium text-white bg-fa-brand hover:bg-fa-brand/90 transition-all"
              >
                <span>Enter Lockdin.AI</span>
                <ArrowRight size={20} />
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="mt-8 flex items-center justify-between pt-6 border-t border-fa-border">
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  className="px-6 py-2 rounded-lg text-fa-text-secondary hover:bg-fa-bg-page transition-colors"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}
              
              <div className="flex space-x-3">
                {step === 3 && (
                  <button
                    onClick={nextStep}
                    className="px-6 py-2 rounded-lg text-fa-text-muted hover:text-fa-text-secondary transition-colors"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={nextStep}
                  disabled={
                    (step === 1 && (!formData.fullName || !formData.age || !formData.grade))
                  }
                  className="flex items-center space-x-2 px-6 py-2 bg-fa-brand text-white rounded-lg hover:bg-fa-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{step === 3 ? 'Continue' : 'Next'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

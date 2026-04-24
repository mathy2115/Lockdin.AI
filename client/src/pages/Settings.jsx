import { useState } from 'react';
import { 
  User, Camera, Bell, BookOpen, Palette, Shield, 
  LogOut, UploadCloud, Plus, X, Download, AlertTriangle, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Switch = ({ checked, onChange }) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
      checked ? 'bg-[#4FC3F7]' : 'bg-[#1A2236] border border-white/10'
    }`}
  >
    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${
      checked ? 'translate-x-5' : 'translate-x-0'
    }`} />
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Mock States for demonstration
  const [profile, setProfile] = useState({ name: 'Alex Student', uni: '', course: '', year: '1' });
  const [focus, setFocus] = useState({ mode: 'Classic', work: 25, break: 5, autoStart: false, sound: true, debounce: 10 });
  const [notifications, setNotifications] = useState({ browser: true, session: true, daily: false, wellness: true });
  const [academic, setAcademic] = useState({ start: '', end: '', gpa: '4.0', subjects: ['Mathematics', 'Computer Science'] });
  const [appearance, setAppearance] = useState({ theme: 'dark', accent: '#4FC3F7' });
  
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [newSubject, setNewSubject] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleExportData = () => {
    // Mock export logic
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ profile, focus, notifications, academic, appearance }));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lockdin_ai_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'focus', label: 'Focus & Camera', icon: <Camera size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'academic', label: 'Academic', icon: <BookOpen size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'account', label: 'Account', icon: <Shield size={18} /> },
  ];

  return (
    <div className="h-full flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-white">
      <header className="pb-6 mb-6 border-b border-white/5">
        <h2 className="text-2xl font-['JetBrains_Mono',monospace] font-bold">Settings</h2>
        <p className="text-gray-400 mt-1 text-sm">Manage your account preferences and app configurations.</p>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0 overflow-y-auto custom-scrollbar pr-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-sm font-semibold ${
                activeTab === tab.id 
                  ? 'bg-[#1A2236] text-[#4FC3F7] shadow-lg border border-[#4FC3F7]/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-[#4FC3F7]' : 'text-gray-500'}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          
          <div className="mt-auto pt-8">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-sm font-semibold text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10"
            >
              <LogOut size={18} className="text-gray-500" />
              Logout
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 bg-[#0D1117] border border-white/5 rounded-2xl p-8 overflow-y-auto custom-scrollbar shadow-xl relative">
          
          {/* PROFILE SECTION */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <h3 className="font-['JetBrains_Mono',monospace] text-xl font-bold border-b border-white/5 pb-4">Profile Settings</h3>
              
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-[#1A2236] border border-white/10 flex items-center justify-center text-gray-500 relative overflow-hidden group cursor-pointer">
                  <User size={40} />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud size={20} className="text-white" />
                  </div>
                </div>
                <div>
                  <button className="px-4 py-2 bg-[#1A2236] hover:bg-white/10 border border-white/10 rounded-lg text-sm font-bold transition-colors">
                    Upload Avatar
                  </button>
                  <p className="text-xs text-gray-500 mt-2">JPEG, PNG under 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-[#1A2236] border border-white/5 focus:border-[#4FC3F7]/50 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">University / School</label>
                  <input 
                    type="text" value={profile.uni} onChange={e => setProfile({...profile, uni: e.target.value})} placeholder="e.g. MIT"
                    className="w-full bg-[#1A2236] border border-white/5 focus:border-[#4FC3F7]/50 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Course / Major</label>
                  <input 
                    type="text" value={profile.course} onChange={e => setProfile({...profile, course: e.target.value})} placeholder="e.g. Computer Science"
                    className="w-full bg-[#1A2236] border border-white/5 focus:border-[#4FC3F7]/50 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Year of Study</label>
                  <select 
                    value={profile.year} onChange={e => setProfile({...profile, year: e.target.value})}
                    className="w-full bg-[#1A2236] border border-white/5 focus:border-[#4FC3F7]/50 rounded-xl px-4 py-3 text-sm outline-none transition-colors appearance-none"
                  >
                    {[1,2,3,4,5,'Graduate'].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <button className="px-6 py-3 bg-[#4FC3F7] text-[#0D1117] font-bold rounded-xl shadow-lg shadow-[#4FC3F7]/20 hover:bg-[#4FC3F7]/90 transition-all">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* FOCUS & CAMERA SECTION */}
          {activeTab === 'focus' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <h3 className="font-['JetBrains_Mono',monospace] text-xl font-bold border-b border-white/5 pb-4">Focus & Camera</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-white mb-4">Pomodoro Defaults</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Default Mode</label>
                      <select 
                        value={focus.mode} onChange={e => setFocus({...focus, mode: e.target.value})}
                        className="w-full bg-[#1A2236] border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                      >
                        <option>Classic (25/5)</option>
                        <option>Deep Work (50/10)</option>
                        <option>Custom</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Work (min)</label>
                      <input 
                        type="number" value={focus.work} onChange={e => setFocus({...focus, work: e.target.value})}
                        className="w-full bg-[#1A2236] border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Break (min)</label>
                      <input 
                        type="number" value={focus.break} onChange={e => setFocus({...focus, break: e.target.value})}
                        className="w-full bg-[#1A2236] border border-white/5 rounded-xl px-4 py-3 text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 bg-[#1A2236]/30 p-5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">Auto-start Breaks</p>
                        <p className="text-xs text-gray-500 mt-1">Automatically start the break timer when work finishes.</p>
                      </div>
                      <Switch checked={focus.autoStart} onChange={v => setFocus({...focus, autoStart: v})} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white">Session-end Sound</p>
                        <p className="text-xs text-gray-500 mt-1">Play a chime when a session completes.</p>
                      </div>
                      <Switch checked={focus.sound} onChange={v => setFocus({...focus, sound: v})} />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-bold text-white mb-2">Presence Detection (AI Camera)</h4>
                  <p className="text-xs text-gray-500 mb-6 max-w-lg leading-relaxed">
                    Set the debounce duration—the amount of time the camera must detect you are away before the session is automatically paused. 
                  </p>
                  
                  <div className="bg-[#1A2236]/30 p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-6 mb-2">
                      <input 
                        type="range" min="3" max="60" step="1"
                        value={focus.debounce}
                        onChange={(e) => setFocus({...focus, debounce: parseInt(e.target.value)})}
                        className="flex-1 accent-[#B39DDB] h-2 bg-[#1A2236] rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="w-16 h-10 bg-[#1A2236] border border-white/10 rounded-lg flex items-center justify-center font-bold text-[#B39DDB]">
                        {focus.debounce}s
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
                      {focus.debounce <= 5 ? "Strict: Rapid pausing" : focus.debounce >= 30 ? "Lenient: Tolerates long absences" : "Balanced"} • Max 60 seconds
                    </p>
                    <div className="mt-4 p-3 bg-[#4FC3F7]/10 border border-[#4FC3F7]/20 rounded-lg flex items-start gap-3">
                      <AlertTriangle size={16} className="text-[#4FC3F7] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#4FC3F7]/90 leading-relaxed">
                        If set to {focus.debounce}s, briefly stepping away won't pause your session — only absences longer than {focus.debounce} seconds will.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="px-6 py-3 bg-[#4FC3F7] text-[#0D1117] font-bold rounded-xl shadow-lg shadow-[#4FC3F7]/20 hover:bg-[#4FC3F7]/90 transition-all">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <h3 className="font-['JetBrains_Mono',monospace] text-xl font-bold border-b border-white/5 pb-4">Notifications</h3>
              
              <div className="space-y-4">
                <div className="bg-[#1A2236]/30 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Browser Notifications</p>
                    <p className="text-xs text-gray-500 mt-1">Allow Lockdin.AI to send push notifications.</p>
                  </div>
                  <Switch checked={notifications.browser} onChange={v => setNotifications({...notifications, browser: v})} />
                </div>
                
                <div className="bg-[#1A2236]/30 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Session Alerts</p>
                    <p className="text-xs text-gray-500 mt-1">Get notified when a work or break block ends.</p>
                  </div>
                  <Switch checked={notifications.session} onChange={v => setNotifications({...notifications, session: v})} />
                </div>

                <div className="bg-[#1A2236]/30 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Daily Reminders</p>
                    <p className="text-xs text-gray-500 mt-1">Morning nudge to plan your study day.</p>
                  </div>
                  <Switch checked={notifications.daily} onChange={v => setNotifications({...notifications, daily: v})} />
                </div>

                <div className="bg-[#1A2236]/30 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Wellness Check-ins</p>
                    <p className="text-xs text-gray-500 mt-1">Prompts to log your mood after long sessions.</p>
                  </div>
                  <Switch checked={notifications.wellness} onChange={v => setNotifications({...notifications, wellness: v})} />
                </div>
              </div>
            </div>
          )}

          {/* ACADEMIC SECTION */}
          {activeTab === 'academic' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <h3 className="font-['JetBrains_Mono',monospace] text-xl font-bold border-b border-white/5 pb-4">Academic Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white">Semester Configuration</h4>
                  <div className="bg-[#1A2236]/30 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Start Date</label>
                      <input 
                        type="date" value={academic.start} onChange={e => setAcademic({...academic, start: e.target.value})}
                        className="w-full bg-[#1A2236] border border-white/5 rounded-xl px-4 py-3 text-sm outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">End Date</label>
                      <input 
                        type="date" value={academic.end} onChange={e => setAcademic({...academic, end: e.target.value})}
                        className="w-full bg-[#1A2236] border border-white/5 rounded-xl px-4 py-3 text-sm outline-none [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">GPA Scale</label>
                      <select 
                        value={academic.gpa} onChange={e => setAcademic({...academic, gpa: e.target.value})}
                        className="w-full bg-[#1A2236] border border-white/5 rounded-xl px-4 py-3 text-sm outline-none appearance-none"
                      >
                        <option value="4.0">4.0 Scale</option>
                        <option value="10.0">10.0 Scale</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white">Active Subjects</h4>
                  <div className="bg-[#1A2236]/30 p-5 rounded-2xl border border-white/5 flex flex-col h-full">
                    <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                      {academic.subjects.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-[#1A2236] p-3 rounded-lg border border-white/5">
                          <span className="text-sm">{sub}</span>
                          <button 
                            onClick={() => setAcademic({...academic, subjects: academic.subjects.filter((_, i) => i !== idx)})}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {academic.subjects.length === 0 && <p className="text-xs text-gray-500 italic">No subjects added.</p>}
                    </div>
                    
                    <div className="mt-auto flex gap-2">
                      <input 
                        type="text" value={newSubject} onChange={e => setNewSubject(e.target.value)}
                        placeholder="Add a subject..."
                        className="flex-1 bg-[#1A2236] border border-white/5 rounded-lg px-3 py-2 text-sm outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newSubject.trim()) {
                            setAcademic({...academic, subjects: [...academic.subjects, newSubject.trim()]});
                            setNewSubject('');
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (newSubject.trim()) {
                            setAcademic({...academic, subjects: [...academic.subjects, newSubject.trim()]});
                            setNewSubject('');
                          }
                        }}
                        className="bg-[#4FC3F7]/20 text-[#4FC3F7] p-2 rounded-lg hover:bg-[#4FC3F7]/30 transition-colors"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE SECTION */}
          {activeTab === 'appearance' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <h3 className="font-['JetBrains_Mono',monospace] text-xl font-bold border-b border-white/5 pb-4">Appearance</h3>
              
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-bold text-white mb-4">Theme Mode</h4>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setAppearance({...appearance, theme: 'dark'})}
                      className={`flex-1 py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        appearance.theme === 'dark' ? 'border-[#4FC3F7] bg-[#4FC3F7]/5' : 'border-white/5 bg-[#1A2236]/30 hover:bg-[#1A2236]'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#0D1117] border border-white/10 flex items-center justify-center">
                        {appearance.theme === 'dark' && <Check size={18} className="text-[#4FC3F7]" />}
                      </div>
                      <span className="font-bold text-sm">Deep Dark</span>
                    </button>
                    <button 
                      onClick={() => setAppearance({...appearance, theme: 'light'})}
                      className={`flex-1 py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 opacity-50 cursor-not-allowed ${
                        appearance.theme === 'light' ? 'border-[#4FC3F7] bg-[#4FC3F7]/5' : 'border-white/5 bg-[#1A2236]/30'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                        {appearance.theme === 'light' && <Check size={18} className="text-[#4FC3F7]" />}
                      </div>
                      <span className="font-bold text-sm">Light Mode <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full ml-1 font-normal">Coming Soon</span></span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white mb-4">Accent Color</h4>
                  <div className="flex gap-4">
                    {[
                      { color: '#4FC3F7', name: 'Electric Blue' },
                      { color: '#B39DDB', name: 'Soft Purple' },
                      { color: '#10B981', name: 'Success Green' },
                      { color: '#F43F5E', name: 'Rose Red' }
                    ].map(swatch => (
                      <button
                        key={swatch.color}
                        onClick={() => setAppearance({...appearance, accent: swatch.color})}
                        className={`w-14 h-14 rounded-full transition-all flex items-center justify-center ${
                          appearance.accent === swatch.color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0D1117] scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.name}
                      >
                        {appearance.accent === swatch.color && <Check size={20} className="text-[#0D1117]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT SECTION */}
          {activeTab === 'account' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <h3 className="font-['JetBrains_Mono',monospace] text-xl font-bold border-b border-white/5 pb-4">Account Management</h3>
              
              <div className="space-y-8">
                {/* Export Data */}
                <div className="bg-[#1A2236]/30 p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Export Data</h4>
                    <p className="text-xs text-gray-500">Download all your Lockdin.AI data (sessions, tasks, wellness logs) as a CSV file.</p>
                  </div>
                  <button 
                    onClick={handleExportData}
                    className="shrink-0 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-bold text-sm transition-all flex items-center gap-2"
                  >
                    <Download size={16} /> Export My Data
                  </button>
                </div>

                {/* Danger Zone */}
                <div className="border border-red-500/30 bg-red-500/5 p-6 rounded-2xl">
                  <h4 className="text-sm font-bold text-red-400 mb-1 flex items-center gap-2">
                    <AlertTriangle size={16} /> Danger Zone
                  </h4>
                  <p className="text-xs text-red-400/70 mb-6">Permanently delete your account and all associated data. This action cannot be undone.</p>
                  
                  <div className="space-y-4">
                    <p className="text-xs text-gray-400">Type <strong className="text-white select-none">delete my account</strong> below to confirm.</p>
                    <div className="flex flex-col md:flex-row gap-4">
                      <input 
                        type="text" 
                        value={deleteConfirm} 
                        onChange={e => setDeleteConfirm(e.target.value)}
                        className="flex-1 bg-black/40 border border-red-500/30 focus:border-red-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                        placeholder="delete my account"
                      />
                      <button 
                        disabled={deleteConfirm !== 'delete my account'}
                        onClick={() => alert('Account deletion simulated.')}
                        className="px-6 py-2.5 bg-red-500 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;

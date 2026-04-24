import { Link } from 'react-router-dom';
import { Timer, Brain, Calendar, Heart, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#0D1117] text-white font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#4FC3F7]/30">
      {/* NAVBAR */}
      <nav className="border-b border-[#1A2236] bg-[#0D1117]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-['JetBrains_Mono',monospace] text-xl font-bold tracking-tighter">
              Lockdin<span className="text-[#4FC3F7]">.AI</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              to="/login" 
              className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              className="text-sm font-bold bg-[#1A2236] hover:bg-[#1A2236]/80 text-[#4FC3F7] px-5 py-2.5 rounded-lg border border-[#4FC3F7]/20 transition-all flex items-center gap-2"
            >
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Subtle background glow effect (no cheap gradients, just a localized soft light) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4FC3F7]/5 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B39DDB]/10 border border-[#B39DDB]/20 text-[#B39DDB] text-xs font-bold mb-8 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#B39DDB] animate-pulse" />
            Built for serious students
          </div>
          <h1 className="font-['JetBrains_Mono',monospace] text-5xl md:text-7xl font-light tracking-tighter mb-8 leading-[1.1] text-white">
            Lock in. Stay focused.<br />
            <span className="font-bold text-[#4FC3F7]">Actually get things done.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The premium study hub combining AI-powered Pomodoro sessions, syllabus-driven academic planning, and wellness tracking to optimize your productivity.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/signup" 
              className="w-full sm:w-auto px-8 py-4 bg-[#4FC3F7] hover:bg-[#4FC3F7]/90 text-[#0D1117] font-black rounded-xl transition-all shadow-[0_0_20px_rgba(79,195,247,0.3)] hover:-translate-y-0.5"
            >
              Start Focusing Now
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto px-8 py-4 bg-[#1A2236] hover:bg-[#1A2236]/70 text-white font-bold rounded-xl border border-white/5 transition-all"
            >
              Login to Account
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 px-6 border-t border-[#1A2236] bg-[#0A0D13]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-['JetBrains_Mono',monospace] text-3xl font-bold mb-4">Everything you need to succeed.</h2>
            <p className="text-gray-400">Minimalist tools designed specifically to combat academic burnout and distraction.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#1A2236] border border-white/5 p-8 rounded-2xl hover:border-[#4FC3F7]/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-[#4FC3F7]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Timer size={24} className="text-[#4FC3F7]" />
              </div>
              <h3 className="font-['JetBrains_Mono',monospace] text-lg font-bold mb-2">Focus Timer</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Deep work sessions with camera-enforced focus tracking to keep you in the zone.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#1A2236] border border-white/5 p-8 rounded-2xl hover:border-[#B39DDB]/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-[#B39DDB]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar size={24} className="text-[#B39DDB]" />
              </div>
              <h3 className="font-['JetBrains_Mono',monospace] text-lg font-bold mb-2">Academic Planner</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Upload your syllabus and let AI automatically generate a day-by-day study schedule.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#1A2236] border border-white/5 p-8 rounded-2xl hover:border-[#4FC3F7]/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-[#4FC3F7]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart size={24} className="text-[#4FC3F7]" />
              </div>
              <h3 className="font-['JetBrains_Mono',monospace] text-lg font-bold mb-2">Wellness Check-in</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Track your mood and energy levels before and after sessions to prevent burnout.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#1A2236] border border-white/5 p-8 rounded-2xl hover:border-[#B39DDB]/30 transition-colors group">
              <div className="w-12 h-12 rounded-xl bg-[#B39DDB]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain size={24} className="text-[#B39DDB]" />
              </div>
              <h3 className="font-['JetBrains_Mono',monospace] text-lg font-bold mb-2">AI Insights</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Receive personalized debriefs and actionable feedback based on your study habits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-[#1A2236] text-center px-6">
        <div className="font-['JetBrains_Mono',monospace] text-xl font-bold tracking-tighter mb-2 opacity-50">
          Lockdin.AI
        </div>
        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
          Focus. Learn. Excel.
        </p>
      </footer>
    </div>
  );
};

export default Landing;

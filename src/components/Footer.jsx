import { Link } from 'react-router-dom';
import { Zap, Mail, Github, LayoutDashboard, PlusCircle } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8 bg-[#0a0e1a] mt-auto">
      <div className="section-container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group mb-4" aria-label="LoopFix AI">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-white">LoopFix<span className="text-blue-400"> AI</span></span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Campus maintenance intelligence that identifies recurring problems before they spiral out of control.
            </p>
            <p className="text-gray-600 text-xs mt-4 italic">
              "Find the problem that keeps coming back."
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/submit" className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-2">
                  <PlusCircle className="w-3.5 h-3.5" /> Report an Issue
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" /> Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Features</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>AI Complaint Analysis</li>
              <li>Recurring Issue Detection</li>
              <li>Historical Complaint Tracking</li>
              <li>Priority Management</li>
            </ul>
          </div>

          {/* Built for */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">About</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>Built for campus communities</li>
              <li>Students · Maintenance · Admin</li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  AI Vibe Coding Hackathon
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">
            &copy; {year} LoopFix AI. Built for the hackathon.
          </p>
          <p className="text-gray-600 text-xs">
            Powered by{' '}
            <span className="text-gray-500">Groq AI · React</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

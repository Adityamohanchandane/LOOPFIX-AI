import { Link } from 'react-router-dom';
import { Home, Search, Zap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="ambient-orb w-96 h-96 bg-blue-600/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 text-center max-w-md animate-fade-in">
        {/* 404 number */}
        <div className="relative mb-6">
          <p className="text-[8rem] md:text-[10rem] font-black text-white/5 leading-none select-none" aria-hidden="true">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Zap className="w-10 h-10 text-blue-400" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          This page doesn't exist in our campus map. Maybe the maintenance team moved it — let's head back to somewhere familiar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-primary">
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            <Search className="w-4 h-4" />
            View Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

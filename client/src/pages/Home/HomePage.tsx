import React from 'react';
import { useAuth } from '../../providers/AuthContext';
import { useNavigate } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const { user, currentContext, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      <header className="bg-white dark:bg-slate-900 sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{currentContext?.buildingName || 'LOBI'}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{currentContext?.type}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleLogout} className="size-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 p-4">
        <div className="bg-primary rounded-xl p-6 text-white shadow-lg relative overflow-hidden mb-6">
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2">שלום, {user?.name || 'משתמש'}</h2>
            <p className="text-white/80 text-sm mb-6 italic">ברוך הבא למערכת LOBI</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold mb-4">פרטי משתמש</h3>
          <p><strong>טלפון:</strong> {user?.phone}</p>
          <p><strong>תפקיד:</strong> {user?.role}</p>
          <p><strong>הקשר נוכחי:</strong> {currentContext?.type}</p>
        </div>
      </main>
    </div>
  );
};

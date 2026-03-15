import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthContext';
import { authService } from '../../api/authService';
import { AuthContextData } from '../../entities/AuthContextData';
import { ContextType } from '../../enums/ContextType';

export const ContextSelectionPage: React.FC = () => {
  const { contexts, setContext } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectContext = async (context: AuthContextData) => {
    setIsLoading(true);
    try {
      const response = await authService.selectContext({
        type: context.type,
        buildingId: context.buildingId,
        apartmentId: context.apartmentId,
      });
      
      setContext(context, response.token);
      navigate('/home');
    } catch (error) {
      console.error('Failed to select context', error);
      alert('שגיאה בבחירת הקשר');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleLabel = (type: ContextType) => {
    switch (type) {
      case ContextType.ADMIN:
        return 'מנהל מערכת';
      case ContextType.MANAGER:
        return 'מנהל מבנה';
      case ContextType.RESIDENT:
        return 'דייר';
      default:
        return 'משתמש';
    }
  };

  const getRoleIcon = (type: ContextType) => {
    switch (type) {
      case ContextType.ADMIN:
        return 'admin_panel_settings';
      case ContextType.MANAGER:
        return 'engineering';
      case ContextType.RESIDENT:
        return 'person';
      default:
        return 'person';
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-slate-900 shadow-xl overflow-x-hidden">
      <div className="flex items-center bg-white dark:bg-slate-900 p-4 pb-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
        <div 
          onClick={() => navigate('/login')}
          className="text-primary dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </div>
        <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight flex-1 text-center mr-[-40px]">
          בחר הקשר
        </h2>
      </div>
      
      <div className="px-4 pt-6 pb-2">
        <h3 className="text-slate-500 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
          הקשרים זמינים עבורך
        </h3>
      </div>
      
      <div className="flex flex-col gap-4 p-4">
        {contexts.map((context, index) => (
          <div 
            key={index}
            className="flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all group"
          >
            <div className="relative h-32 w-full bg-slate-200 dark:bg-slate-700 bg-center bg-cover" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=400&h=200")' }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight">
                  {context.buildingName || 'מערכת ניהול'}
                </p>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-sm">{getRoleIcon(context.type)}</span>
                  <p className="text-sm font-medium leading-normal">{getRoleLabel(context.type)}</p>
                </div>
              </div>
              <button 
                onClick={() => handleSelectContext(context)}
                disabled={isLoading}
                className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white gap-2 text-sm font-semibold transition-transform active:scale-95 disabled:opacity-70"
              >
                <span>{isLoading ? '...' : 'כניסה'}</span>
                <span className="material-symbols-outlined text-sm">arrow_back</span>
              </button>
            </div>
          </div>
        ))}
        
        {contexts.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            לא נמצאו הקשרים זמינים עבורך.
          </div>
        )}
      </div>
    </div>
  );
};

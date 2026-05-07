import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLang } from '../context/LanguageContext';
import { RefreshCw, X } from 'lucide-react';

function ReloadPrompt() {
  const { t } = useLang();
  const {
    offlineReady: offlineReadyState = [false, () => {}],
    needRefresh: needRefreshState = [false, () => {}],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
       
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
       
      console.error('SW registration error', error);
    },
  });

  const [offlineReady, setOfflineReady] = offlineReadyState;
  const [needRefresh, setNeedRefresh] = needRefreshState;

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 flex items-center gap-4 max-w-sm">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 animate-pulse">
           <RefreshCw size={24} />
        </div>
        
        <div className="flex-grow">
          <p className="m-0 text-sm font-bold text-slate-900 dark:text-white leading-tight">
            {needRefresh ? t('pwa_update_available') : 'App ready to work offline'}
          </p>
          {needRefresh && (
            <button 
              onClick={() => updateServiceWorker(true)}
              className="mt-2 bg-primary hover:bg-primary-dark text-white border-none px-4 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-colors"
            >
              {t('doc_update')}
            </button>
          )}
        </div>

        <button 
          onClick={() => close()}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 border-none bg-transparent cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

export default ReloadPrompt;

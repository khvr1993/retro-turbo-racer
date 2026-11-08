import React, { useState } from 'react';
import { useOnlineStatus, usePWAInstall } from '../pwa/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Hide install button if already running as an installed standalone Android/iOS app
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        onClick={handleInstallClick}
        aria-label="Install Android App"
        data-testid="pwa-install-btn"
        className="tactile-btn flex items-center gap-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/60 px-2.5 py-1 text-[11px] font-mono-tabular font-bold text-emerald-300 cursor-pointer whitespace-nowrap"
      >
        <svg
          className="w-3.5 h-3.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        <span>{isIOS ? 'Install iOS' : 'Install Android'}</span>
      </button>

      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Install Game on Android or Mobile"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-[#111827] border-2 border-slate-700 p-5 text-left shadow-2xl font-sans">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg font-bold text-white">
                Install Turbo Racer DX-99
              </h3>
              <span className="text-[11px] font-mono-tabular text-emerald-400 font-bold">
                PWA READY
              </span>
            </div>

            {isIOS ? (
              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <p>To install on iPhone or iPad:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-200">
                  <li>
                    Tap the <strong>Share</strong> button in Safari.
                  </li>
                  <li>
                    Select <strong>Add to Home Screen</strong>.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <p>
                  This game is configured as a standalone Android Progressive
                  Web App with offline caching:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-200">
                  <li>
                    Open the game URL directly in <strong>Chrome on Android</strong>{' '}
                    (outside the preview frame).
                  </li>
                  <li>
                    Tap the browser menu <strong>(⋮)</strong> and select{' '}
                    <strong>Install app</strong> or{' '}
                    <strong>Add to Home screen</strong>.
                  </li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="tactile-btn mt-4 w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 py-2 text-xs font-display font-bold text-slate-950 cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-mono-tabular font-bold text-slate-950 shadow-lg"
    >
      <span>OFFLINE MODE · CACHED GAME ACTIVE</span>
    </div>
  );
};

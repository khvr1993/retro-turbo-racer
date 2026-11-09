import React, { useRef, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useOnlineStatus, usePWAInstall } from '../pwa/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, showGuideModal);

  // Hide install button if already running as an installed standalone Android/iOS app
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
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
        onClick={handleInstallClick}
        aria-label="Install App"
        data-testid="pwa-install-btn"
        className="tactile-btn focus-ring flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-emerald-400/60 bg-emerald-500/20 px-2.5 py-1 font-mono-tabular text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30"
      >
        <svg
          className="h-3.5 w-3.5 shrink-0"
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
          onKeyDown={(event) => {
            if (event.key === 'Escape') setShowGuideModal(false);
          }}
        >
          <div
            ref={modalRef}
            className="w-full max-w-sm rounded-2xl border-2 border-slate-700 bg-[var(--surface-panel)] p-5 text-left font-sans shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">
                Install Turbo Racer DX-99
              </h3>
              <span className="font-mono-tabular text-[11px] font-bold text-emerald-400">
                PWA READY
              </span>
            </div>

            {isIOS ? (
              <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                <p>To install on iPhone or iPad:</p>
                <ol className="list-inside list-decimal space-y-1.5 text-slate-200">
                  <li>
                    Tap the <strong>Share</strong> button in Safari.
                  </li>
                  <li>
                    Select <strong>Add to Home Screen</strong>.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs leading-relaxed text-slate-300">
                <p>
                  This game is configured as a standalone Android Progressive Web
                  App with offline caching:
                </p>
                <ol className="list-inside list-decimal space-y-1.5 text-slate-200">
                  <li>
                    Open the game URL directly in <strong>Chrome on Android</strong>{' '}
                    (outside the preview frame).
                  </li>
                  <li>
                    Tap the browser menu <strong>(⋮)</strong> and select{' '}
                    <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </li>
                </ol>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="tactile-btn focus-ring mt-4 w-full cursor-pointer rounded-lg bg-emerald-500 py-2 font-display text-xs font-bold text-slate-950 hover:bg-emerald-400"
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
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 font-mono-tabular text-xs font-bold text-slate-950 shadow-lg"
    >
      <span>OFFLINE MODE · CACHED GAME ACTIVE</span>
    </div>
  );
};

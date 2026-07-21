import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

interface LoadingContextType {
  showLoader: (message?: string) => void;
  hideLoader: () => void;
  withLoader: <T>(asyncFn: () => Promise<T>, message?: string) => Promise<T>;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType>({
  showLoader: () => {},
  hideLoader: () => {},
  withLoader: async (fn) => fn(),
  isLoading: false,
});

const MIN_VISIBLE_DURATION = 250; // minimum visible time (~200-300ms) to prevent UI flickering on fast operations
const FADE_DURATION = 180; // visual fade transition duration (150-200ms)

// Global reference holders for non-React call hooks
let globalShowLoader: ((message?: string) => void) | null = null;
let globalHideLoader: (() => void) | null = null;

export const showGlobalLoader = (message?: string) => {
  if (globalShowLoader) globalShowLoader(message);
};

export const hideGlobalLoader = () => {
  if (globalHideLoader) globalHideLoader();
};

export const withGlobalLoader = async <T,>(asyncFn: () => Promise<T>, message?: string): Promise<T> => {
  showGlobalLoader(message);
  try {
    return await asyncFn();
  } finally {
    hideGlobalLoader();
  }
};

export const useLoading = () => useContext(LoadingContext);

export interface LoadingProviderProps {
  children: React.ReactNode;
  defaultMessage?: string;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children, defaultMessage = 'Loading…' }) => {
  const [activeCount, setActiveCount] = useState<number>(0);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [message, setMessage] = useState<string>(defaultMessage);

  const startTimeRef = useRef<number | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showLoader = useCallback((msg?: string) => {
    setMessage(msg || defaultMessage);

    // Cancel any scheduled hide or fade unmount timers if a new process starts
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    setActiveCount((prev) => {
      if (prev === 0) {
        startTimeRef.current = Date.now();
        setIsMounted(true);
        // Double rAF ensures smooth CSS opacity transition on initial mount
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsVisible(true);
          });
        });
      }
      return prev + 1;
    });
  }, [defaultMessage]);

  const hideLoader = useCallback(() => {
    setActiveCount((prev) => {
      const nextCount = Math.max(0, prev - 1);
      
      if (nextCount === 0) {
        const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : MIN_VISIBLE_DURATION;
        const remainingMinTime = Math.max(0, MIN_VISIBLE_DURATION - elapsed);

        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

        hideTimerRef.current = setTimeout(() => {
          // 1. Begin visual fade-out
          setIsVisible(false);

          // 2. Unmount after fade animation completes
          if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
          fadeTimerRef.current = setTimeout(() => {
            setIsMounted(false);
            startTimeRef.current = null;
          }, FADE_DURATION);
        }, remainingMinTime);
      }

      return nextCount;
    });
  }, []);

  const withLoader = useCallback(async <T,>(asyncFn: () => Promise<T>, msg?: string): Promise<T> => {
    showLoader(msg);
    try {
      return await asyncFn();
    } finally {
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  // Expose global function pointers
  useEffect(() => {
    globalShowLoader = showLoader;
    globalHideLoader = hideLoader;
    return () => {
      globalShowLoader = null;
      globalHideLoader = null;
    };
  }, [showLoader, hideLoader]);

  return (
    <LoadingContext.Provider value={{ showLoader, hideLoader, withLoader, isLoading: activeCount > 0 }}>
      {children}
      {isMounted && (
        <div 
          className={`infinite-spinner-overlay ${isVisible ? 'visible' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Loading indicator"
        >
          <div className="infinite-spinner-card">
            <div className="infinite-spinner-wrap">
              <svg className="infinite-spinner-svg" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
                {/* Faint static track so loop shape reads mid-animation */}
                <path
                  className="infinite-spinner-track"
                  d="M 100,50
                     C 100,20 60,20 60,50
                     C 60,80 100,80 100,50
                     C 100,20 140,20 140,50
                     C 140,80 100,80 100,50
                     Z" 
                />
                {/* Animated traveling infinity loop */}
                <path
                  className="infinite-spinner-loop"
                  d="M 100,50
                     C 100,20 60,20 60,50
                     C 60,80 100,80 100,50
                     C 100,20 140,20 140,50
                     C 140,80 100,80 100,50
                     Z" 
                />
              </svg>
            </div>
            <div className="infinite-spinner-label">{message}</div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export function LoadingSpinnerOverlay() {
  return null; // Rendered automatically by LoadingProvider
}


'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type ToastKind = 'info' | 'live' | 'warn' | 'good';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  href?: string;
  hrefLabel?: string;
}

interface ToastApi {
  push: (t: Omit<Toast, 'id'>) => number;
  dismiss: (id: number) => void;
}

const Ctx = createContext<ToastApi | null>(null);

export function useToasts(): ToastApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useToasts must be used within ToastProvider');
  return api;
}

const ACCENT: Record<ToastKind, string> = {
  info: 'rgb(var(--muted-rgb))',
  live: 'rgb(var(--phosphor-rgb))',
  warn: 'rgb(var(--coral-rgb))',
  good: 'rgb(var(--phosphor-rgb))',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((prev) => [...prev, { ...t, id }]);
      if (t.kind !== 'live') {
        setTimeout(() => dismiss(id), 7000);
      }
      return id;
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        className="fixed bottom-20 right-4 z-[120] flex w-[min(92vw,360px)] flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="relative overflow-hidden rounded-sm border bg-panel/95 p-3 shadow-2xl backdrop-blur hairline"
              style={{ borderLeft: `2px solid ${ACCENT[t.kind]}` }}
              role="status"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="display text-sm font-600 uppercase tracking-wide"
                    style={{ color: ACCENT[t.kind] }}
                  >
                    {t.title}
                  </p>
                  {t.body ? <p className="mt-1 break-words text-xs text-muted">{t.body}</p> : null}
                  {t.href ? (
                    <a
                      href={t.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono mt-2 inline-block text-xs text-phosphor underline decoration-dotted underline-offset-2"
                    >
                      {t.hrefLabel ?? 'open'}
                    </a>
                  ) : null}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="mono shrink-0 text-faint transition-colors hover:text-ink"
                >
                  x
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

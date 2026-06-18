'use client';

import { AnimatePresence, motion } from 'framer-motion';

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Continue',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] grid place-items-center bg-bg/80 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            className="w-full max-w-md rounded-sm border bg-panel p-5 hairline glow-mint"
          >
            <h2 className="display text-lg font-700 uppercase tracking-wide text-ink">{title}</h2>
            <p className="mt-2 text-sm text-muted">{body}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={onCancel}
                className="rounded-sm border px-4 py-2 text-sm text-muted transition-colors hover:text-ink hairline"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                autoFocus
                className="rounded-sm border border-phosphor/50 bg-phosphor/10 px-4 py-2 text-sm font-600 text-phosphor transition-colors hover:bg-phosphor/20"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Drawer } from "vaul";
import { X } from "lucide-react";
import { useIsDesktop } from "../../../hooks/useMediaQuery";
import IconButton from "./IconButton";

function CloseButton({ onClose }) {
  return (
    <IconButton aria-label="Cerrar" variant="solid" size="sm" onClick={onClose} className="shrink-0">
      <X size={16} strokeWidth={2.2} />
    </IconButton>
  );
}

/**
 * Detail surface that changes composition by viewport: a centered modal on
 * desktop (not anchored to a trigger, so it stays centered — apple-design
 * skill §7), a bottom sheet on mobile (draggable via vaul, dismiss path
 * mirrors the entry path).
 */
export default function Sheet({ open, onOpenChange, title, description, children, footer }) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return createPortal(
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="relative z-10 flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-3xl bg-white shadow-raised"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            >
              <div className="flex items-start justify-between gap-3 px-6 pb-1 pt-6">
                <div className="min-w-0">
                  <h2 className="text-[18px] font-semibold tracking-display text-ink">{title}</h2>
                  {description && <p className="mt-0.5 text-[13.5px] text-ink-muted">{description}</p>}
                </div>
                <CloseButton onClose={() => onOpenChange(false)} />
              </div>
              <div className="overflow-y-auto px-6 py-5">{children}</div>
              {footer && <div className="border-t border-line px-6 py-4">{footer}</div>}
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    );
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-[2px]" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[88vh] flex-col rounded-t-3xl bg-white shadow-sheet outline-none"
        >
          <div className="mx-auto mt-3 h-1.5 w-9 shrink-0 rounded-full bg-line-strong" />
          <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
            <div className="min-w-0">
              <Drawer.Title className="text-[17px] font-semibold tracking-display text-ink">{title}</Drawer.Title>
              {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
            </div>
            <CloseButton onClose={() => onOpenChange(false)} />
          </div>
          <div className="overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
          {footer && (
            <div className="border-t border-line px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">{footer}</div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

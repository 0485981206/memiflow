import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const triggerHaptic = (intensity = 8) => {
  if (navigator.vibrate) navigator.vibrate(intensity);
};

const VARIANTS = {
  default: "bg-primary text-primary-foreground shadow-md hover:shadow-lg",
  destructive: "bg-destructive text-destructive-foreground shadow-md hover:shadow-lg",
  outline: "border-2 border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
  ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
};

const SIZES = {
  default: "h-12 px-6 text-sm min-w-[120px]",
  sm: "h-10 px-4 text-xs min-w-[80px]",
  lg: "h-14 px-8 text-base min-w-[140px]",
  icon: "h-12 w-12",
};

export default function ActionButton({
  children,
  variant = "default",
  size = "default",
  loading = false,
  success = false,
  error = false,
  disabled = false,
  className,
  onClick,
  ripple = true,
  ...props
}) {
  const buttonRef = React.useRef(null);
  const [ripples, setRipples] = React.useState([]);
  const [isPressed, setIsPressed] = React.useState(false);

  const isDisabled = disabled || loading;
  const hasState = loading || success || error;

  const handleRipple = React.useCallback((e) => {
    if (!ripple || isDisabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y, size }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);
  }, [ripple, isDisabled]);

  const handleClick = React.useCallback((e) => {
    if (isDisabled) return;
    triggerHaptic(success ? 15 : 8);
    handleRipple(e);
    onClick?.(e);
  }, [isDisabled, success, onClick, handleRipple]);

  const handlePointerDown = React.useCallback(() => {
    if (!isDisabled) setIsPressed(true);
  }, [isDisabled]);

  const handlePointerUp = React.useCallback(() => {
    setIsPressed(false);
  }, []);

  // Determine visual state
  const stateClasses = error
    ? "!bg-red-500 !text-white !shadow-red-500/25"
    : success
    ? "!bg-emerald-500 !text-white !shadow-emerald-500/25"
    : "";

  return (
    <motion.button
      ref={buttonRef}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-xl font-medium",
        "select-none touch-manipulation overflow-hidden",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        VARIANTS[variant] || VARIANTS.default,
        SIZES[size] || SIZES.default,
        stateClasses,
        className
      )}
      disabled={isDisabled}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      animate={
        error
          ? { x: [0, -6, 6, -4, 4, -2, 2, 0] }
          : { scale: isPressed ? 0.95 : 1 }
      }
      transition={
        error
          ? { duration: 0.4, ease: "easeInOut" }
          : { type: "spring", stiffness: 500, damping: 30 }
      }
      whileHover={!isDisabled && !hasState ? { scale: 1.02 } : undefined}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full bg-white/25 pointer-events-none"
          style={{ left: r.x - r.size / 2, top: r.y - r.size / 2, width: r.size, height: r.size }}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      ))}

      {/* Content with state transitions */}
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
          </motion.span>
        ) : success ? (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="flex items-center justify-center"
          >
            <Check className="w-5 h-5" strokeWidth={3} />
          </motion.span>
        ) : error ? (
          <motion.span
            key="error"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" strokeWidth={3} />
            <span>Fout</span>
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center gap-2"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
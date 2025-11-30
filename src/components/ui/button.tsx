import * as React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "default",
      size = "default",
      className = "",
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default:
        "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/40 hover:from-emerald-400 hover:to-teal-400 border border-emerald-300/30",
      secondary:
        "bg-white/10 text-white border border-white/20 hover:border-amber-200/40",
      ghost:
        "bg-transparent text-white hover:bg-white/10 border border-white/15",
    };

    const sizeClasses = {
      sm: "px-3 py-1.5 text-xs",
      default: "px-5 py-2.5 text-sm",
      lg: "px-6 py-3 text-lg",
    };

    const combinedClasses = `inline-flex items-center justify-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-300/50 focus:ring-offset-1 focus:ring-offset-emerald-950/60 disabled:opacity-50 disabled:pointer-events-none backdrop-blur ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

    return (
      <button ref={ref} className={combinedClasses} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

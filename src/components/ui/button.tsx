"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        {
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm":
            variant === "primary",
          "border border-border bg-surface text-foreground hover:bg-secondary shadow-sm":
            variant === "secondary",
          "hover:bg-secondary text-foreground": variant === "ghost",
          "text-primary underline-offset-4 hover:underline": variant === "link",
        },
        {
          "h-11 min-h-[44px] px-6": size === "md",
          "h-12 min-h-[44px] px-8 text-base": size === "lg",
          "h-11 min-h-[44px] px-4 text-sm": size === "sm",
          "h-11 w-11 min-h-[44px] min-w-[44px]": size === "icon",
        },
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button };

import { classNames } from "@/lib/utils";

type Variant = "new" | "sale" | "low" | "sold" | "gold" | "neutral";

const styles: Record<Variant, string> = {
  new: "bg-foreground text-white",
  sale: "bg-accent text-foreground",
  low: "bg-danger text-white",
  sold: "bg-muted text-white",
  gold: "bg-accent text-foreground",
  neutral: "bg-border text-foreground",
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

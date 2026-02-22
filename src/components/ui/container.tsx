import { cn } from "@/lib/utils";

type ContainerProps = {
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
};

export function Container({ children, fullWidth = false, className }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto px-4 sm:px-6 lg:px-8",
        {
          "max-w-6xl": !fullWidth,
        },
        className,
      )}
    >
      {children}
    </div>
  );
}

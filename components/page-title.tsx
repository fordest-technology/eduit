import { LucideIcon } from "lucide-react";

interface PageTitleProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
}

export function PageTitle({ title, description, icon: Icon }: PageTitleProps) {
  return (
    <div className="flex items-start gap-4">
      {Icon && (
        <div className="mt-1">
          <div className="p-2 rounded-md bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );
} 
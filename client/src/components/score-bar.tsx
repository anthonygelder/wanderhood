import { cn } from "@/lib/utils";

interface ScoreBarProps {
  label: string;
  score: number;
  icon?: React.ReactNode;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ScoreBar({ label, score, icon, showLabel = true, size = "md" }: ScoreBarProps) {
  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-chart-3";
    if (score >= 60) return "bg-chart-1";
    if (score >= 40) return "bg-chart-2";
    return "bg-chart-5";
  };

  const heightClass = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className="space-y-1.5" data-testid={`score-bar-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <span className="text-sm font-semibold">{score}</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted", heightClass[size])}>
        <div
          className={cn("rounded-full transition-all duration-500", heightClass[size], getBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

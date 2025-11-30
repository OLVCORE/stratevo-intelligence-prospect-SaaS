import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowUp, Minus, TrendingUp } from "lucide-react";

interface LeadPriorityBadgeProps {
  priority: "low" | "medium" | "high" | "urgent";
}

export const LeadPriorityBadge = ({ priority }: LeadPriorityBadgeProps) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case "urgent":
        return {
          icon: AlertCircle,
          label: "Urgente",
          className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        };
      case "high":
        return {
          icon: TrendingUp,
          label: "Alta",
          className: "bg-orange-500 text-white hover:bg-orange-600",
        };
      case "medium":
        return {
          icon: ArrowUp,
          label: "Média",
          className: "bg-yellow-500 text-white hover:bg-yellow-600",
        };
      case "low":
        return {
          icon: Minus,
          label: "Baixa",
          className: "bg-muted text-muted-foreground hover:bg-muted/80",
        };
      default:
        return {
          icon: Minus,
          label: "Média",
          className: "bg-muted text-muted-foreground hover:bg-muted/80",
        };
    }
  };

  const { icon: Icon, label, className } = getPriorityConfig();

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
};

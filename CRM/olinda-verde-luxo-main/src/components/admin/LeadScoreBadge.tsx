import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface LeadScoreBadgeProps {
  score: number;
}

export const LeadScoreBadge = ({ score }: LeadScoreBadgeProps) => {
  const getScoreConfig = () => {
    if (score >= 80) {
      return {
        label: "Quente",
        className: "bg-green-500 text-white hover:bg-green-600",
      };
    } else if (score >= 60) {
      return {
        label: "Morno",
        className: "bg-yellow-500 text-white hover:bg-yellow-600",
      };
    } else if (score >= 40) {
      return {
        label: "Frio",
        className: "bg-blue-500 text-white hover:bg-blue-600",
      };
    } else {
      return {
        label: "Gelado",
        className: "bg-gray-400 text-white hover:bg-gray-500",
      };
    }
  };

  const { label, className } = getScoreConfig();

  return (
    <Badge variant="outline" className={className}>
      <Star className="h-3 w-3 mr-1 fill-current" />
      {score} - {label}
    </Badge>
  );
};

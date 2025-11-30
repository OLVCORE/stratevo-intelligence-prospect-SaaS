import { Badge } from "@/components/ui/badge";
import { Globe, MessageCircle, Facebook, Instagram, Phone } from "lucide-react";

interface LeadSourceBadgeProps {
  source: string;
  size?: "sm" | "md" | "lg";
}

export const LeadSourceBadge = ({ source, size = "md" }: LeadSourceBadgeProps) => {
  const getSourceConfig = (src: string) => {
    const normalizedSource = src?.toLowerCase() || 'website';
    
    switch (normalizedSource) {
      case 'website':
        return {
          label: 'Site',
          icon: Globe,
          variant: 'default' as const,
          className: 'bg-blue-500 hover:bg-blue-600 text-white'
        };
      case 'whatsapp':
        return {
          label: 'WhatsApp',
          icon: MessageCircle,
          variant: 'default' as const,
          className: 'bg-green-500 hover:bg-green-600 text-white'
        };
      case 'facebook':
        return {
          label: 'Facebook',
          icon: Facebook,
          variant: 'default' as const,
          className: 'bg-blue-600 hover:bg-blue-700 text-white'
        };
      case 'instagram':
        return {
          label: 'Instagram',
          icon: Instagram,
          variant: 'default' as const,
          className: 'bg-pink-500 hover:bg-pink-600 text-white'
        };
      case 'phone':
      case 'telefone':
        return {
          label: 'Telefone',
          icon: Phone,
          variant: 'default' as const,
          className: 'bg-purple-500 hover:bg-purple-600 text-white'
        };
      default:
        return {
          label: normalizedSource,
          icon: Globe,
          variant: 'outline' as const,
          className: ''
        };
    }
  };

  const config = getSourceConfig(source);
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-2',
    md: 'text-sm py-1 px-2.5',
    lg: 'text-base py-1.5 px-3'
  };

  return (
    <Badge 
      variant={config.variant}
      className={`flex items-center gap-1.5 ${config.className} ${sizeClasses[size]}`}
    >
      <Icon className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
      {config.label}
    </Badge>
  );
};

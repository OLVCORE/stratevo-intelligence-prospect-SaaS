import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Linkedin, Twitter, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LeadSocialMediaProps {
  leadId: string;
  leadName: string;
}

export const LeadSocialMedia = ({ leadId, leadName }: LeadSocialMediaProps) => {
  const navigate = useNavigate();
  
  const socialNetworks = [
    { name: "Facebook", icon: Facebook, color: "text-blue-600", configured: false },
    { name: "Instagram", icon: Instagram, color: "text-pink-600", configured: false },
    { name: "LinkedIn", icon: Linkedin, color: "text-blue-700", configured: false },
    { name: "Twitter", icon: Twitter, color: "text-blue-400", configured: false },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {socialNetworks.map((network) => (
          <Card key={network.name} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6 text-center">
              <network.icon className={`h-8 w-8 mx-auto mb-3 ${network.color}`} />
              <p className="text-sm font-medium text-foreground mb-3">{network.name}</p>
              <Button 
                variant={network.configured ? "secondary" : "outline"} 
                size="sm" 
                className="w-full"
                disabled
              >
                {network.configured ? "Configurado" : "Em breve"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-8">
        <CardContent className="text-center py-12">
          <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Configure as integrações do Facebook e Instagram para receber leads automaticamente
          </p>
          <Button onClick={() => navigate("/admin/integrations")}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar Integrações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

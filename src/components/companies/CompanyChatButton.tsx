import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { CompanyIntelligenceChat } from "./CompanyIntelligenceChat";

interface CompanyChatButtonProps {
  company: any;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
}

export function CompanyChatButton({ 
  company, 
  variant = "ghost", 
  size = "icon" 
}: CompanyChatButtonProps) {
  const [chatOpen, setChatOpen] = useState(false);

  // Abrir chat quando o botão for clicado
  const handleOpenChat = () => {
    setChatOpen(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className="h-8 w-8 p-0"
        onClick={handleOpenChat}
        title="Intelligence Copilot - Pergunte sobre esta empresa"
      >
        <Brain className="h-4 w-4 text-primary" />
      </Button>
      {chatOpen && (
        <CompanyIntelligenceChat 
          company={company}
        />
      )}
    </>
  );
}

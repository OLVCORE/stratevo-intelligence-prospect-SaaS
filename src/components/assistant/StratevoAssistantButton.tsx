// src/components/assistant/StratevoAssistantButton.tsx
// Botão principal do Assistente Virtual da STRATEVO com prioridade para voz

import { useState, useEffect, useCallback } from "react";
import { Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EnhancedPublicChatWidget } from "@/components/public/EnhancedPublicChatWidget";
import { Button } from "@/components/ui/button";

export const StratevoAssistantButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowWelcome(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const handleMainButtonClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* Botão Principal Flutuante */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            {/* Mensagem de Boas-Vindas */}
            {showWelcome && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute bottom-20 right-0 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg max-w-xs text-sm mb-2"
              >
                👋 Olá! Sou o Assistente Virtual da STRATEVO. Clique aqui para conversar!
                <div className="absolute bottom-0 right-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-primary transform translate-y-full" />
              </motion.div>
            )}

            {/* Botão Principal */}
            <Button
              onClick={handleMainButtonClick}
              className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-primary/20"
              style={{ touchAction: 'manipulation' }}
            >
              <Brain className="w-8 h-8 text-primary-foreground" />
              
              {/* Indicador de Pulsação */}
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/30"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget de Chat (abre quando botão é clicado) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 w-[90vw] max-w-md h-[80vh] max-h-[600px]"
          >
            <EnhancedPublicChatWidget />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};



// src/features/linkedin/components/LinkedInConnect.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Linkedin, AlertCircle, Loader2 } from "lucide-react";
import { useLinkedInAccount } from "../hooks/useLinkedInAccount";

export function LinkedInConnect() {
  const { connect, isConnecting } = useLinkedInAccount();
  const [open, setOpen] = useState(false);
  const [liAtCookie, setLiAtCookie] = useState("");
  const [jsessionidCookie, setJsessionidCookie] = useState("");

  const handleConnect = () => {
    connect({
      li_at_cookie: liAtCookie,
      jsessionid_cookie: jsessionidCookie || undefined,
    }, {
      onSuccess: () => {
        setOpen(false);
        setLiAtCookie("");
        setJsessionidCookie("");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Linkedin className="h-4 w-4" />
          Conectar LinkedIn
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            Conectar sua conta LinkedIn
          </DialogTitle>
          <DialogDescription>
            Para conectar sua conta, você precisa fornecer os cookies de autenticação do LinkedIn.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Como obter os cookies</AlertTitle>
          <AlertDescription className="text-sm">
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Faça login no LinkedIn em seu navegador</li>
              <li>Abra as Ferramentas do Desenvolvedor (F12)</li>
              <li>Vá para a aba "Application" {">"} "Cookies"</li>
              <li>Encontre "www.linkedin.com"</li>
              <li>Copie o valor do cookie "li_at"</li>
              <li>Opcionalmente, copie "JSESSIONID"</li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="li_at">
              Cookie li_at <span className="text-destructive">*</span>
            </Label>
            <Input
              id="li_at"
              type="password"
              placeholder="AQEDAxxxx..."
              value={liAtCookie}
              onChange={(e) => setLiAtCookie(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jsessionid">Cookie JSESSIONID (opcional)</Label>
            <Input
              id="jsessionid"
              type="password"
              placeholder="ajax:xxxx..."
              value={jsessionidCookie}
              onChange={(e) => setJsessionidCookie(e.target.value)}
            />
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Aviso de Segurança</AlertTitle>
          <AlertDescription className="text-sm">
            Seus cookies são armazenados de forma segura e criptografada. Nunca compartilhe
            esses cookies com terceiros. Eles dão acesso total à sua conta LinkedIn.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!liAtCookie || isConnecting}
          >
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Conectar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


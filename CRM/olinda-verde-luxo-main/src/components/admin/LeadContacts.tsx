import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Mail, Phone, Trash2, User, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeadContactsProps {
  leadId: string;
}

interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  is_primary: boolean;
}

export const LeadContacts = ({ leadId }: LeadContactsProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    is_primary: false,
  });

  useEffect(() => {
    fetchContacts();
  }, [leadId]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_contacts")
        .select("*")
        .eq("lead_id", leadId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    try {
      const { error } = await supabase.from("lead_contacts").insert({
        lead_id: leadId,
        ...formData,
      });

      if (error) throw error;

      toast.success("Contato adicionado");
      setFormData({ name: "", email: "", phone: "", position: "", is_primary: false });
      setShowForm(false);
      fetchContacts();
    } catch (error: any) {
      console.error("Error adding contact:", error);
      toast.error("Erro ao adicionar contato");
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from("lead_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      toast.success("Contato removido");
      fetchContacts();
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      toast.error("Erro ao remover contato");
    }
  };

  const handleSetPrimary = async (contactId: string) => {
    try {
      // Remove primary from all contacts
      await supabase
        .from("lead_contacts")
        .update({ is_primary: false })
        .eq("lead_id", leadId);

      // Set new primary
      const { error } = await supabase
        .from("lead_contacts")
        .update({ is_primary: true })
        .eq("id", contactId);

      if (error) throw error;

      toast.success("Contato principal atualizado");
      fetchContacts();
    } catch (error: any) {
      console.error("Error setting primary contact:", error);
      toast.error("Erro ao atualizar contato principal");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Contatos</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Novo Contato
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_primary"
                checked={formData.is_primary}
                onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_primary" className="cursor-pointer">
                Contato Principal
              </Label>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Adicionar</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum contato adicional
            </p>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{contact.name}</p>
                        {contact.is_primary && (
                          <Badge variant="default" className="h-5">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Principal
                          </Badge>
                        )}
                      </div>
                      {contact.position && (
                        <p className="text-sm text-muted-foreground">{contact.position}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!contact.is_primary && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetPrimary(contact.id)}
                        title="Definir como principal"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(contact.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${contact.email}`} className="hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${contact.phone}`} className="hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

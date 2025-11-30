import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProposalBuilder } from "@/components/admin/ProposalBuilder";
import { ProposalTemplateManager } from "@/components/admin/ProposalTemplateManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

// Security: Input validation schema
const proposalBlockSchema = z.object({
  id: z.string(),
  type: z.enum(["header", "services", "pricing", "terms", "notes", "custom"]),
  content: z.record(z.any()),
  order: z.number().int().min(0),
});

const proposalDataSchema = z.object({
  blocks: z.array(proposalBlockSchema).max(50, "Máximo de 50 blocos permitidos"),
  lead_id: z.string().uuid().optional(),
  event_type: z.string().max(100),
  venue_price: z.number().min(0),
  final_price: z.number().min(0),
});

export default function ProposalEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadId = searchParams.get("lead_id");
  const eventType = searchParams.get("event_type") || "casamento";
  
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [previewBlocks, setPreviewBlocks] = useState<any[]>([]);

  const handleSaveProposal = async (blocks: any[]) => {
    try {
      // Security: Validate input
      const validationResult = proposalDataSchema.safeParse({
        blocks,
        lead_id: leadId,
        event_type: eventType,
        venue_price: 0,
        final_price: 0,
      });

      if (!validationResult.success) {
        toast.error("Dados inválidos: " + validationResult.error.errors[0].message);
        return;
      }

      // Security: Ensure user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar autenticado");
        navigate("/login");
        return;
      }

      // Generate proposal number
      const { data: proposalNumberData, error: proposalNumberError } = await supabase
        .rpc("generate_proposal_number");

      if (proposalNumberError) {
        console.error("Error generating proposal number:", proposalNumberError);
        toast.error("Erro ao gerar número da proposta");
        return;
      }

      // Calculate basic values from blocks
      let venuePrice = 0;
      let cateringPrice = 0;
      let decorationPrice = 0;

      blocks.forEach(block => {
        if (block.type === "pricing") {
          venuePrice = block.content.venue_price || 0;
          cateringPrice = block.content.catering_price || 0;
          decorationPrice = block.content.decoration_price || 0;
        }
      });

      const totalPrice = venuePrice + cateringPrice + decorationPrice;

      const proposalData = {
        lead_id: leadId,
        event_type: eventType,
        proposal_number: proposalNumberData,
        venue_price: venuePrice,
        catering_price: cateringPrice,
        decoration_price: decorationPrice,
        total_price: totalPrice,
        discount_percentage: 0,
        final_price: totalPrice,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        status: "draft",
        blocks: blocks, // Save blocks structure
      };

      const { error } = await supabase.from("proposals").insert(proposalData);

      if (error) {
        console.error("Error saving proposal:", error);
        toast.error("Erro ao salvar proposta");
        return;
      }

      toast.success("Proposta salva com sucesso!");
      navigate("/admin/propostas");
    } catch (error) {
      console.error("Error in handleSaveProposal:", error);
      toast.error("Erro inesperado ao salvar proposta");
    }
  };

  const handlePreview = (blocks: any[]) => {
    setPreviewBlocks(blocks);
  };

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    toast.success(`Template "${template.name}" selecionado!`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Editor de Propostas</h1>
          <p className="text-muted-foreground">Crie propostas profissionais com drag & drop</p>
        </div>
        
        <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="builder">Editor Visual</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="builder" className="space-y-4">
          <ProposalBuilder
            initialBlocks={selectedTemplate?.blocks}
            onSave={handleSaveProposal}
            onPreview={handlePreview}
          />
          
          {previewBlocks.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Preview da Proposta</h3>
              <div className="space-y-4">
                {previewBlocks.map((block, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold capitalize mb-2">{block.type}</h4>
                    <pre className="text-sm bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(block.content, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="templates">
          <ProposalTemplateManager onSelectTemplate={handleSelectTemplate} />
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, FileText, Clock, Trash2, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LeadFilesProps {
  leadId: string;
}

export const LeadFiles = ({ leadId }: LeadFilesProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
    
    const channel = supabase
      .channel(`files-${leadId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_files',
          filter: `lead_id=eq.${leadId}`
        },
        () => fetchFiles()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from("lead_files")
      .select("*")
      .eq("lead_id", leadId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching files:", error);
    } else {
      setFiles(data || []);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const file of fileList) {
        // Upload para Supabase Storage
        const filePath = `${leadId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('lead-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Registrar no banco de dados
        const { error: dbError } = await supabase.from("lead_files").insert({
          lead_id: leadId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          uploaded_by: user?.id,
        });

        if (dbError) throw dbError;
      }

      toast.success(`${fileList.length} arquivo(s) enviado(s) com sucesso!`);
      fetchFiles();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erro ao enviar arquivos");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string, filePath: string) => {
    try {
      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('lead-files')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error: dbError } = await supabase
        .from("lead_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;
      toast.success("Arquivo removido com sucesso!");
      fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Erro ao remover arquivo");
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('lead-files')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Erro ao baixar arquivo");
    }
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <CardContent className="pt-12 pb-12 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-medium text-foreground mb-2">
            Arraste arquivos aqui ou clique para fazer upload
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Suporta PDF, imagens, documentos e mais
          </p>
          <Button 
            variant="outline"
            disabled={uploading}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.onchange = (e: any) => handleFiles(Array.from(e.target.files));
              input.click();
            }}
          >
            {uploading ? "Registrando..." : "Selecionar Arquivos"}
          </Button>
        </CardContent>
      </Card>

      {files.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum arquivo registrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.file_size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(file.uploaded_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.file_path, file.file_name)}
                      title="Baixar arquivo"
                    >
                      <Download className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id, file.file_path)}
                      title="Excluir arquivo"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

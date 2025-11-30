import { Mail, Phone, Instagram, MapPin, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const contactSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  phone: z.string().trim().min(8, "Telefone inválido").max(30),
  eventType: z.string().trim().min(1, "Selecione o tipo de evento").max(50),
  date: z.string().trim().max(20).optional(),
  message: z.string().trim().min(1, "Escreva uma mensagem").max(1000),
});

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    date: "",
    message: "",
    website: "", // Honeypot field
    attachments: [] as File[],
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data without attachments field
    const { attachments, ...dataToValidate } = formData;
    const parsed = contactSchema.safeParse(dataToValidate);
    if (!parsed.success) {
      const firstErr = parsed.error.errors[0]?.message || "Dados inválidos";
      toast.error(firstErr);
      return;
    }

    setSending(true);
    try {
      // Convert files to base64 if present
      let attachmentsData = null;
      if (formData.attachments.length > 0) {
        attachmentsData = await Promise.all(
          formData.attachments.map((file) => {
            return new Promise<{ name: string; type: string; data: string }>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve({
                  name: file.name,
                  type: file.type,
                  data: base64,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          })
        );
      }

      const { data, error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          to: "consultores@espacoolinda.com.br",
          ...parsed.data,
          attachments: attachmentsData,
        },
      });

      if (error) throw error;

      if (data && data.emailSent === false) {
        toast.warning("Recebemos sua mensagem, mas o e-mail não foi entregue.", {
          description:
            "Se preferir, fale conosco agora pelo WhatsApp.",
          action: {
            label: "WhatsApp",
            onClick: () =>
              window.open(
                "https://wa.me/5511921033333?text=Olá!%20Gostaria%20de%20mais%20informações%20sobre%20o%20Espaço%20Olinda",
                "_blank"
              ),
          },
          duration: 8000,
          className: "bg-card text-card-foreground border-primary/20",
        });
      } else {
        toast.success("Mensagem Recebida com Sucesso!", {
          description:
            "Agradecemos seu contato. Um de nossos consultores retornará em breve para auxiliá-lo no planejamento do seu evento.",
          action: {
            label: "WhatsApp",
            onClick: () =>
              window.open(
                "https://wa.me/5511921033333?text=Olá!%20Gostaria%20de%20mais%20informações%20sobre%20o%20Espaço%20Olinda",
                "_blank"
              ),
          },
          duration: 7000,
          className: "bg-card text-card-foreground border-primary/20",
        });
      }

      setFormData({ name: "", email: "", phone: "", eventType: "", date: "", message: "", website: "", attachments: [] });
      } catch (err) {
        console.error("Erro ao enviar formulário", err);
        // Fallback: oferecer envio via e-mail/WhatsApp do usuário
        const subject = `Solicitação via site - ${formData.eventType || "Evento"} - ${formData.name}`.trim();
        const body = [
          `Nome: ${formData.name}`,
          `E-mail: ${formData.email}`,
          `Telefone: ${formData.phone}`,
          `Tipo de evento: ${formData.eventType}`,
          formData.date ? `Data: ${formData.date}` : "",
          "",
          "Mensagem:",
          formData.message,
        ]
          .filter(Boolean)
          .join("\n");
        const mailtoLink = `mailto:consultores@espacoolinda.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        const waText = `Olá! Seguem meus dados:%0A${encodeURIComponent(body)}`;
        const waLink = `https://wa.me/5511921033333?text=${waText}`;

        toast.error("Não foi possível enviar agora. Tente por outro canal.", {
          action: {
            label: "Enviar por e-mail",
            onClick: () => (window.location.href = mailtoLink),
          },
          duration: 8000,
        });
        // Oferece também WhatsApp
        setTimeout(() => {
          toast.message("Ou fale agora pelo WhatsApp", {
            action: {
              label: "Abrir WhatsApp",
              onClick: () => window.open(waLink, "_blank"),
            },
            duration: 8000,
          });
        }, 300);
      } finally {
        setSending(false);
      }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 5) {
      toast.error("Você pode anexar no máximo 5 arquivos");
      e.target.value = "";
      return;
    }
    
    // Check each file size
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Alguns arquivos são muito grandes. Tamanho máximo por arquivo: 10MB");
      e.target.value = "";
      return;
    }
    
    setFormData({
      ...formData,
      attachments: files,
    });
  };

  return (
    <section id="contato" className="py-24 lg:py-32 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Info */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Vamos Realizar Seu <span className="text-primary">Evento dos Sonhos</span>
            </h2>
            <p className="text-xl text-foreground/80 mb-10 leading-relaxed">
              Entre em contato para agendar uma visita e conhecer pessoalmente o Espaço Olinda.
              Nossa equipe está pronta para criar uma experiência única e inesquecível.
            </p>

            {/* Contact Info */}
            <div className="space-y-6">
              <a
                href="tel:+551126751446"
                className="flex items-center gap-4 group hover:text-primary transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-foreground/60 mb-1">Telefone Fixo</div>
                  <div className="font-semibold">(11) 2675-1446</div>
                </div>
              </a>

              <div className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm text-foreground/60 mb-1">WhatsApp</div>
                    <a
                      href="https://wa.me/5511921033333?text=Olá!%20Gostaria%20de%20mais%20informações%20sobre%20o%20Espaço%20Olinda"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      (11) 92103-3333
                    </a>
                  </div>
                  <a
                    href="https://wa.me/5511921033333?text=Olá!%20Gostaria%20de%20mais%20informações%20sobre%20o%20Espaço%20Olinda"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center hover:bg-[#20BA5A] transition-all hover:scale-110 shadow-lg"
                    aria-label="Fale conosco no WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5 text-white" />
                  </a>
                </div>
              </div>

              <a
                href="mailto:consultores@espacoolinda.com.br"
                className="flex items-center gap-4 group hover:text-primary transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-foreground/60 mb-1">E-mail</div>
                  <div className="font-semibold">consultores@espacoolinda.com.br</div>
                </div>
              </a>

              <a
                href="https://instagram.com/espacoolinda"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 group hover:text-primary transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Instagram className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-foreground/60 mb-1">Instagram</div>
                  <div className="font-semibold">@espacoolinda</div>
                </div>
              </a>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-foreground/60 mb-1">Localização</div>
                  <div className="font-semibold">Estrada da Pedra Branca, Km 1,5 - Santa Isabel, SP</div>
                  <a
                    href="https://waze.com/ul/h6gz5e4hkx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm mt-1 inline-block"
                  >
                    Abrir no Waze
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="card-premium p-8 lg:p-10">
            <h3 className="text-2xl font-bold mb-6">Solicite um Orçamento</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Completo</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-primary/20 focus:border-primary focus:outline-none transition-colors"
                  placeholder="Seu nome"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">E-mail</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-primary/20 focus:border-primary focus:outline-none transition-colors"
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Telefone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-primary/20 focus:border-primary focus:outline-none transition-colors"
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Evento</label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-primary/20 focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">Selecione...</option>
                  <option value="casamento">Casamento</option>
                  <option value="corporativo">Evento Corporativo</option>
                  <option value="hospedagem">Hospedagem</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data Prevista</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-primary/20 focus:border-primary focus:outline-none transition-colors"
                />
              </div>

               <div>
                <label className="block text-sm font-medium mb-2">Mensagem</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-primary/20 focus:border-primary focus:outline-none transition-colors resize-none"
                  placeholder="Conte-nos mais sobre seu evento..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Anexar Arquivos <span className="text-xs text-muted-foreground">(Opcional - PDF, imagens, plantas - Até 5 arquivos, 10MB cada)</span>
                </label>
                <input
                  type="file"
                  name="attachments"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  multiple
                  className="w-full px-4 py-3 rounded-lg bg-secondary/50 border border-primary/20 focus:border-primary focus:outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {formData.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.attachments.map((file, index) => (
                      <p key={index} className="text-sm text-muted-foreground">
                        {index + 1}. {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Honeypot field - hidden from users, bots will fill it */}
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
                className="absolute opacity-0 pointer-events-none"
                aria-hidden="true"
              />

              <button type="submit" className="w-full btn-hero text-center" disabled={sending}>
                {sending ? "Enviando..." : "Enviar Solicitação"}
              </button>
            </form>
          </div>
        </div>

        {/* Google Maps */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-6 text-center">Nossa Localização</h3>
          <div className="rounded-xl overflow-hidden shadow-2xl border border-primary/20">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3661.058941234567!2d-46.22342532399634!3d-23.317089279073697!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce61e8dbcc4c07%3A0x7b3d8c9e5f1a2b4c!2sEstrada%20da%20Pedra%20Branca%2C%20Km%201%2C5%20-%20Santa%20Isabel%2C%20SP!5e0!3m2!1spt-BR!2sbr!4v1234567890123!5m2!1spt-BR!2sbr"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização Espaço Olinda - Estrada da Pedra Branca, Km 1,5, Santa Isabel, SP"
            />
          </div>
          <div className="text-center mt-4 space-x-4">
            <a
              href="https://waze.com/ul/h6gz5e4hkx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Abrir no Waze
            </a>
            <span className="text-muted-foreground">•</span>
            <a
              href="https://maps.app.goo.gl/huT3APdZyHYnC3Vs9?g_st=iw"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Abrir no Google Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;

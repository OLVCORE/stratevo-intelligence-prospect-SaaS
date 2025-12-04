/**
 * 🗺️ MAPA COMPETITIVO DO BRASIL
 * Visualização geográfica unificada com Ranking de Capital + Distribuição
 * Pins interativos com tooltip (hover) e modal (click)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2, DollarSign, Package, MapPinned, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Competitor {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cidade: string;
  estado: string;
  capitalSocial: number;
  produtosCount?: number;
}

interface CompetitiveMapBrazilProps {
  competitors: Competitor[];
  isOpen?: boolean;
  onToggle?: () => void;
}

// Criar ícones coloridos por capital social
const createColoredIcon = (capitalSocial: number) => {
  const color = capitalSocial >= 50000000 ? '#dc2626' : // Vermelho (ALTA)
                capitalSocial >= 5000000 ? '#ea580c' :  // Laranja (MÉDIA)
                '#22c55e'; // Verde (BAIXA)
  
  const svgIcon = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.4 12.5 28.5 12.5 28.5S25 20.9 25 12.5C25 5.6 19.4 0 12.5 0z" 
            fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-pin-icon',
    iconSize: [25, 41],
    iconAnchor: [12.5, 41],
    popupAnchor: [0, -41]
  });
};

// Coordenadas de cidades brasileiras
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  'SAO PAULO-SP': { lat: -23.5505, lng: -46.6333 },
  'GUARULHOS-SP': { lat: -23.4538, lng: -46.5333 },
  'SANTO ANDRE-SP': { lat: -23.6636, lng: -46.5341 },
  'SAO JOSE DOS PINHAIS-PR': { lat: -25.5347, lng: -49.2064 },
  'ARAUCARIA-PR': { lat: -25.5928, lng: -49.4091 },
  'ITAJAI-SC': { lat: -26.9078, lng: -48.6619 },
  'DORES DE CAMPOS-MG': { lat: -21.0836, lng: -43.9928 },
  'CRISTINA-MG': { lat: -22.2114, lng: -45.2708 },
  'BOCAINA-SP': { lat: -22.1350, lng: -48.5194 },
  // Adicionar mais conforme necessário
};

export default function CompetitiveMapBrazil({ 
  competitors,
  isOpen = false,
  onToggle
}: CompetitiveMapBrazilProps) {
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular geocoding (já temos coordenadas fixas)
    setLoading(false);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCompetitorLocation = (comp: Competitor) => {
    const key = `${comp.cidade.toUpperCase()}-${comp.estado}`;
    return cityCoordinates[key] || { lat: -15.7801, lng: -47.9292 }; // Brasília default
  };

  // Classificar nível de ameaça por capital
  const getThreatLevel = (capitalSocial: number) => {
    if (capitalSocial >= 50000000) return { label: 'ALTA', color: 'bg-red-600' };
    if (capitalSocial >= 5000000) return { label: 'MÉDIA', color: 'bg-orange-600' };
    return { label: 'BAIXA', color: 'bg-green-600' };
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card className="border-l-4 border-l-indigo-600/90 shadow-md">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer bg-gradient-to-r from-slate-50/50 to-slate-100/30 dark:from-slate-900/40 dark:to-slate-800/20 hover:from-indigo-50/60 hover:to-indigo-100/40 dark:hover:from-indigo-900/20 dark:hover:to-indigo-800/20 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600/10 rounded-lg">
                    <MapPinned className="h-5 w-5 text-indigo-700 dark:text-indigo-500" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-lg text-indigo-800 dark:text-indigo-100 font-semibold">
                      Mapa Competitivo do Brasil
                    </CardTitle>
                    <CardDescription>
                      {competitors.length} concorrentes • Ranking por Capital Social + Distribuição Geográfica
                    </CardDescription>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-indigo-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-indigo-600" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                  <span className="ml-3 text-muted-foreground">Carregando mapa...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Legenda */}
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-600"></div>
                      <span>ALTA (&gt;R$50M)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                      <span>MÉDIA (R$5M-50M)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-600"></div>
                      <span>BAIXA (&lt;R$5M)</span>
                    </div>
                  </div>

                  {/* Mapa */}
                  <div className="h-[500px] rounded-lg overflow-hidden border-2 border-slate-300 dark:border-slate-700">
                    <MapContainer
                      center={[-15.7801, -47.9292]} // Centro do Brasil
                      zoom={4}
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      
                      {competitors.map((comp, idx) => {
                        const location = getCompetitorLocation(comp);
                        const threat = getThreatLevel(comp.capitalSocial);
                        
                        return (
                          <Marker
                            key={idx}
                            position={[location.lat, location.lng]}
                            icon={createColoredIcon(comp.capitalSocial)}
                            eventHandlers={{
                              click: () => setSelectedCompetitor(comp),
                            }}
                          >
                            {/* Tooltip no Hover */}
                            <Tooltip direction="top" offset={[0, -40]} opacity={1}>
                              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border-2 border-indigo-500 min-w-[220px]">
                                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                  {comp.nomeFantasia || comp.razaoSocial.split(' ').slice(0, 3).join(' ')}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {comp.cidade}, {comp.estado}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className={threat.color}>{threat.label}</Badge>
                                  <span className="text-xs font-semibold">{formatCurrency(comp.capitalSocial)}</span>
                                </div>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                                  👆 Clique para detalhes completos
                                </p>
                              </div>
                            </Tooltip>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </div>

                  {/* Ranking Resumido abaixo do mapa */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {competitors
                      .sort((a, b) => b.capitalSocial - a.capitalSocial)
                      .slice(0, 8)
                      .map((comp, idx) => {
                        const threat = getThreatLevel(comp.capitalSocial);
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all cursor-pointer"
                            onClick={() => setSelectedCompetitor(comp)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                              <Badge className={`${threat.color} text-[10px]`}>{threat.label}</Badge>
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                              {comp.nomeFantasia || comp.razaoSocial.split(' ').slice(0, 2).join(' ')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(comp.capitalSocial)}</p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                              {comp.cidade}, {comp.estado}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Modal com Detalhes Completos */}
      {selectedCompetitor && (
        <Dialog open={!!selectedCompetitor} onOpenChange={() => setSelectedCompetitor(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600" />
                {selectedCompetitor.nomeFantasia || selectedCompetitor.razaoSocial}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Informações principais */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">CNPJ</p>
                  <p className="text-sm font-semibold">{selectedCompetitor.cnpj}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Capital Social</p>
                  <p className="text-sm font-semibold text-green-600">{formatCurrency(selectedCompetitor.capitalSocial)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Localização</p>
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    {selectedCompetitor.cidade}, {selectedCompetitor.estado}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Produtos Cadastrados</p>
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <Package className="h-4 w-4 text-orange-600" />
                    {selectedCompetitor.produtosCount || 0} produtos
                  </p>
                </div>
              </div>

              {/* Classificação de Ameaça */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg border-2 border-indigo-200 dark:border-indigo-800">
                <p className="text-xs text-muted-foreground mb-2">CLASSIFICAÇÃO DE AMEAÇA</p>
                <div className="flex items-center gap-3">
                  <Badge className={`${getThreatLevel(selectedCompetitor.capitalSocial).color} text-sm px-3 py-1`}>
                    {getThreatLevel(selectedCompetitor.capitalSocial).label}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {selectedCompetitor.capitalSocial >= 50000000 
                      ? 'Player dominante com recursos significativos'
                      : selectedCompetitor.capitalSocial >= 5000000
                      ? 'Concorrente de médio porte com capacidade competitiva'
                      : 'Concorrente de pequeno porte'
                    }
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}


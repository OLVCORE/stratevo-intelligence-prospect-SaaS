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

// CSS customizado para popups e modal
const customStyles = `
  <style>
    .custom-popup .leaflet-popup-content-wrapper {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      padding: 0 !important;
    }
    .custom-popup .leaflet-popup-tip {
      background: #3730a3 !important;
    }
    .leaflet-container {
      z-index: 1 !important;
    }
  </style>
`;

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
  endereco?: string;
  bairro?: string;
  cep?: string;
}

interface CompetitiveMapBrazilProps {
  competitors: Competitor[];
  tenant?: {
    nome: string;
    cnpj: string;
    cidade: string;
    estado: string;
    capitalSocial?: number;
    produtosCount?: number;
  };
  isOpen?: boolean;
  onToggle?: () => void;
}

// Criar ícones coloridos por capital social
const createColoredIcon = (capitalSocial: number, isTenant = false) => {
  if (isTenant) {
    // PIN PULSANTE ESPECIAL para o TENANT
    const svgIcon = `
      <svg width="35" height="51" viewBox="0 0 35 51" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <style>
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.1); }
            }
            .pulse-pin { animation: pulse 2s ease-in-out infinite; }
          </style>
        </defs>
        <g class="pulse-pin" filter="url(#glow)">
          <path d="M17.5 0C10.6 0 5 5.6 5 12.5c0 8.4 12.5 38.5 12.5 38.5S30 20.9 30 12.5C30 5.6 24.4 0 17.5 0z" 
                fill="#22c55e" stroke="#fff" stroke-width="3"/>
          <circle cx="17.5" cy="12.5" r="7" fill="#fff"/>
          <text x="17.5" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="#22c55e">★</text>
        </g>
      </svg>
    `;
    
    return L.divIcon({
      html: svgIcon,
      className: 'tenant-pin-icon',
      iconSize: [35, 51],
      iconAnchor: [17.5, 51],
      popupAnchor: [0, -51]
    });
  }
  
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
  tenant,
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
      <div dangerouslySetInnerHTML={{ __html: customStyles }} />
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
                      
                      {/* 🌟 PIN DO TENANT (PULSANTE E DESTACADO) */}
                      {tenant && (() => {
                        const tenantKey = `${tenant.cidade.toUpperCase()}-${tenant.estado}`;
                        const tenantLocation = cityCoordinates[tenantKey] || { lat: -23.5505, lng: -46.6333 };
                        
                        return (
                          <Marker
                            position={[tenantLocation.lat, tenantLocation.lng]}
                            icon={createColoredIcon(0, true)}
                          >
                            <Popup permanent className="tenant-popup">
                              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-3 rounded-lg border-2 border-green-500 min-w-[220px]">
                                <p className="font-bold text-sm text-green-800 dark:text-green-100 flex items-center gap-2">
                                  ⭐ {tenant.nome}
                                </p>
                                <Badge className="bg-green-600 mt-1 mb-2">SUA EMPRESA</Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {tenant.cidade}, {tenant.estado}
                                </p>
                                <p className="text-xs font-semibold mt-2">
                                  📦 {tenant.produtosCount || 0} produtos
                                </p>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })()}
                      
                      {/* PINS DOS CONCORRENTES */}
                      {competitors.map((comp, idx) => {
                        const location = getCompetitorLocation(comp);
                        const threat = getThreatLevel(comp.capitalSocial);
                        
                        return (
                          <Marker
                            key={idx}
                            position={[location.lat, location.lng]}
                            icon={createColoredIcon(comp.capitalSocial, false)}
                            eventHandlers={{
                              click: () => {
                                console.log('[Mapa] Clicou em:', comp.razaoSocial);
                                setSelectedCompetitor(comp);
                              }
                            }}
                          >
                            {/* Popup com design corporativo responsivo */}
                            <Popup className="custom-popup">
                              <div className="min-w-[260px] p-1">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-2 border-indigo-500 dark:border-indigo-600">
                                  <p className="font-bold text-base text-slate-900 dark:text-slate-50">
                                    {comp.nomeFantasia || comp.razaoSocial.split(' ').slice(0, 3).join(' ')}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {comp.cidade}, {comp.estado}
                                  </p>
                                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                                    <strong>CNPJ:</strong> {comp.cnpj}
                                  </p>
                                  <div className="flex items-center gap-2 mt-3">
                                    <Badge className={`${threat.color} text-white`}>{threat.label}</Badge>
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-50">{formatCurrency(comp.capitalSocial)}</span>
                                  </div>
                                  {comp.produtosCount !== undefined && (
                                    <p className="text-xs text-orange-700 dark:text-orange-400 mt-2 font-medium flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      {comp.produtosCount} produtos cadastrados
                                    </p>
                                  )}
                                  <div 
                                    className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/30 p-2 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCompetitor(comp);
                                    }}
                                  >
                                    <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold text-center">
                                      👆 Clique para detalhes completos
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </div>

                  {/* Ranking Resumido abaixo do mapa - TODOS os concorrentes + Tenant */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {/* TENANT SEMPRE EM PRIMEIRO (destacado) */}
                    {tenant && (
                      <div
                        className="p-3 rounded-lg border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 hover:border-green-600 transition-all cursor-pointer shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge className="bg-green-600 text-[10px]">⭐ VOCÊ</Badge>
                        </div>
                        <p className="text-sm font-bold text-green-800 dark:text-green-100 truncate">
                          {tenant.nome}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{tenant.capitalSocial ? formatCurrency(tenant.capitalSocial) : 'N/A'}</p>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1 font-medium">
                          {tenant.cidade}, {tenant.estado}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          📦 {tenant.produtosCount || 0} produtos
                        </p>
                      </div>
                    )}
                    
                    {/* TODOS OS CONCORRENTES (não apenas 8) */}
                    {competitors
                      .sort((a, b) => b.capitalSocial - a.capitalSocial)
                      .map((comp, idx) => {
                        const threat = getThreatLevel(comp.capitalSocial);
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all cursor-pointer hover:shadow-md"
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
                              📍 {comp.cidade}, {comp.estado}
                            </p>
                            {comp.produtosCount && comp.produtosCount > 0 && (
                              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                📦 {comp.produtosCount} produtos
                              </p>
                            )}
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

      {/* Modal com Detalhes Completos - Z-INDEX ALTO */}
      <Dialog open={!!selectedCompetitor} onOpenChange={() => setSelectedCompetitor(null)}>
        <DialogContent className="max-w-2xl" style={{ zIndex: 9999 }}>
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

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Localização Completa</p>
                <p className="text-sm font-semibold flex items-start gap-1">
                  <MapPin className="h-4 w-4 text-indigo-600 mt-0.5" />
                  <span>
                    {selectedCompetitor.endereco && `${selectedCompetitor.endereco}, `}
                    {selectedCompetitor.bairro && `${selectedCompetitor.bairro}, `}
                    {selectedCompetitor.cidade}, {selectedCompetitor.estado}
                    {selectedCompetitor.cep && ` - CEP: ${selectedCompetitor.cep}`}
                  </span>
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Produtos Cadastrados</p>
                <p className="text-sm font-semibold flex items-center gap-1">
                  <Package className="h-4 w-4 text-orange-600" />
                  {selectedCompetitor.produtosCount !== undefined && selectedCompetitor.produtosCount > 0 
                    ? `${selectedCompetitor.produtosCount} produtos extraídos do website`
                    : 'Aguardando extração de produtos'
                  }
                </p>
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


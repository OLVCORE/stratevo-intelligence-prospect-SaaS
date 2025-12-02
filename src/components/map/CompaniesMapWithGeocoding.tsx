import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom tooltip styling
const tooltipStyle = `
<style>
  .custom-marker-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .custom-marker-tooltip::before {
    display: none !important;
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

interface Company {
  id: string;
  name: string;
  cidade: string;
  estado: string;
  tipo: 'Cliente' | 'Benchmarking' | 'Concorrente';
  faturamento?: number;
  expectativa?: number;
  setor?: string;
  capitalSocial?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

interface CompaniesMapWithGeocodingProps {
  companies: Company[];
  height?: string;
  markerColor?: 'green' | 'blue' | 'red';
  markerLabel?: string;
}

export default function CompaniesMapWithGeocoding({ 
  companies,
  height = '400px',
  markerColor = 'blue',
  markerLabel = 'Empresa'
}: CompaniesMapWithGeocodingProps) {
  const [companiesWithLocation, setCompaniesWithLocation] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });

  // Geocodificar empresas usando coordenadas fixas por cidade (fallback para evitar CORS)
  useEffect(() => {
    const geocodeCompanies = async () => {
      if (companies.length === 0) {
        setLoading(false);
        return;
      }

      setGeocodingProgress({ current: 0, total: companies.length });
      const geocoded: Company[] = [];

      // Mapa de coordenadas de cidades brasileiras (fallback para evitar CORS do Nominatim)
      const cityCoordinates: Record<string, { lat: number; lng: number }> = {
        // São Paulo
        'SAO PAULO-SP': { lat: -23.5505, lng: -46.6333 },
        'GUARULHOS-SP': { lat: -23.4538, lng: -46.5333 },
        'SANTO ANDRE-SP': { lat: -23.6636, lng: -46.5341 },
        'SAO JOSE DOS CAMPOS-SP': { lat: -23.1791, lng: -45.8872 },
        'SUZANO-SP': { lat: -23.5425, lng: -46.3108 },
        'BOCAINA-SP': { lat: -22.1386, lng: -48.5108 },
        // Santa Catarina
        'ITAJAI-SC': { lat: -26.9077, lng: -48.6611 },
        'JARAGUA DO SUL-SC': { lat: -26.4847, lng: -49.0661 },
        // Rio de Janeiro
        'RIO DE JANEIRO-RJ': { lat: -22.9068, lng: -43.1729 },
        // Paraná
        'SAO JOSE DOS PINHAIS-PR': { lat: -25.5347, lng: -49.2064 },
        'ARAUCARIA-PR': { lat: -25.5928, lng: -49.4103 },
        // Minas Gerais
        'CRISTINA-MG': { lat: -22.2133, lng: -45.2722 },
      };

      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        const cityKey = `${company.cidade}-${company.estado}`.toUpperCase();
        
        // Usar coordenadas do mapa ou tentar geocodificar (com delay)
        if (cityCoordinates[cityKey]) {
          geocoded.push({
            ...company,
            location: cityCoordinates[cityKey],
          });
        } else {
          // Tentar geocodificar (com delay maior para evitar rate limit)
          try {
            const query = `${company.cidade}, ${company.estado}, Brasil`;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`,
              {
                headers: {
                  'User-Agent': 'Stratevo Intelligence Prospect',
                  'Accept': 'application/json',
                }
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data && data.length > 0) {
                const { lat, lon } = data[0];
                geocoded.push({
                  ...company,
                  location: {
                    lat: parseFloat(lat),
                    lng: parseFloat(lon),
                  },
                });
              } else {
                geocoded.push(company);
              }
            } else {
              geocoded.push(company);
            }

            // Delay de 2 segundos entre requisições para respeitar rate limit
            if (i < companies.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (error) {
            console.warn(`[Map] Erro ao geocodificar ${company.name}:`, error);
            geocoded.push(company);
          }
        }

        setGeocodingProgress({ current: i + 1, total: companies.length });
      }

      setCompaniesWithLocation(geocoded);
      setLoading(false);
    };

    geocodeCompanies();
  }, [companies]);

  // Centro padrão: Brasil
  const defaultCenter: [number, number] = [-15.7942, -47.8825];
  
  // Calcular centro baseado nas empresas geocodificadas
  const companiesWithCoords = companiesWithLocation.filter(c => c.location?.lat && c.location?.lng);
  const center = companiesWithCoords.length > 0
    ? [
        companiesWithCoords.reduce((sum, c) => sum + (c.location!.lat), 0) / companiesWithCoords.length,
        companiesWithCoords.reduce((sum, c) => sum + (c.location!.lng), 0) / companiesWithCoords.length,
      ] as [number, number]
    : defaultCenter;

  if (loading) {
    return (
      <Card className="mt-4">
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">
            Geocodificando {geocodingProgress.current} de {geocodingProgress.total} empresas...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (companiesWithCoords.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="flex items-center justify-center h-64 bg-muted rounded-lg">
          <p className="text-muted-foreground text-center">
            Nenhuma empresa com localização geocodificada<br/>
            <span className="text-xs">Aguarde a geocodificação ou verifique se cidade/estado estão corretos</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4" />
          Mapa de Localização
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {companiesWithCoords.length} {companiesWithCoords.length === 1 ? 'empresa' : 'empresas'} no mapa
          {companies.length > companiesWithCoords.length && (
            <span className="ml-1">({companies.length - companiesWithCoords.length} sem localização)</span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border">
          <MapContainer
            center={center}
            zoom={companiesWithCoords.length === 1 ? 10 : 5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {companiesWithCoords.map((company) => {
              // Determinar cor do marcador e gradiente do tooltip
              let markerIconUrl, gradientStart, gradientEnd, emoji, label;
              
              if (company.tipo === 'Cliente') {
                markerIconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png';
                gradientStart = '#10b981';
                gradientEnd = '#059669';
                emoji = '🟢';
                label = 'Cliente Atual';
              } else if (company.tipo === 'Concorrente') {
                markerIconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png';
                gradientStart = '#ef4444';
                gradientEnd = '#dc2626';
                emoji = '🔴';
                label = 'Concorrente Direto';
              } else {
                markerIconUrl = 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png';
                gradientStart = '#3b82f6';
                gradientEnd = '#2563eb';
                emoji = '🔵';
                label = 'Empresa Desejada';
              }
              
              // Criar tooltip HTML customizado para o marcador
              const tooltipContent = `
                <div style="
                  background: linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%);
                  color: white;
                  padding: 8px 12px;
                  border-radius: 6px;
                  font-size: 12px;
                  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                  min-width: 180px;
                  white-space: nowrap;
                ">
                  <div style="font-weight: 600; margin-bottom: 4px;">${company.name}</div>
                  <div style="opacity: 0.9;">📍 ${company.cidade}, ${company.estado}</div>
                  <div style="opacity: 0.8; font-size: 10px; margin-top: 2px;">${emoji} ${label}</div>
                </div>
              `;
              
              return (
                <Marker
                  key={company.id}
                  position={[company.location!.lat, company.location!.lng]}
                  icon={L.icon({
                    iconUrl: markerIconUrl,
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [0, -41],
                  })}
                  eventHandlers={{
                    mouseover: (e) => {
                      const marker = e.target;
                      marker.bindTooltip(tooltipContent, {
                        permanent: false,
                        direction: 'top',
                        className: 'custom-marker-tooltip',
                        offset: [0, -40],
                      }).openTooltip();
                    },
                    mouseout: (e) => {
                      const marker = e.target;
                      marker.closeTooltip();
                    },
                  }}
                >
                  <Popup>
                    <div className="p-3 min-w-[220px]">
                      <h3 className="font-semibold text-base mb-2">{company.name}</h3>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {emoji} {label}
                        </p>
                        <p className="text-xs font-medium">
                          📍 {company.cidade}, {company.estado}
                        </p>
                        {company.setor && (
                          <p className="text-xs">
                            🏭 {company.setor}
                          </p>
                        )}
                        {company.faturamento && company.faturamento > 0 && (
                          <p className="text-xs mt-2 font-semibold text-green-700">
                            💰 Faturamento Atual: R$ {company.faturamento.toLocaleString('pt-BR')}
                          </p>
                        )}
                        {company.expectativa && company.expectativa > 0 && (
                          <p className="text-xs mt-2 font-semibold text-blue-700">
                            💰 Expectativa de Faturamento: R$ {company.expectativa.toLocaleString('pt-BR')}
                          </p>
                        )}
                        {company.capitalSocial && company.capitalSocial > 0 && (
                          <p className="text-xs mt-1">
                            💼 Capital Social: R$ {company.capitalSocial.toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}


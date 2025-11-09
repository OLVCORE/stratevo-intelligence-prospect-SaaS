import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, MapPin, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  location?: {
    lat?: number;
    lng?: number;
    city?: string;
    state?: string;
  };
  industry?: string;
  employees?: number;
}

interface CompaniesMapProps {
  companies?: Company[];
  height?: string;
  showStats?: boolean;
}

export default function CompaniesMap({ 
  companies: propCompanies,
  height = '500px',
  showStats = true 
}: CompaniesMapProps) {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState({ total: 0, withLocation: 0, byState: {} as Record<string, number> });

  // Buscar empresas do banco se não fornecidas
  useEffect(() => {
    const fetchCompanies = async () => {
      if (propCompanies) {
        setCompanies(propCompanies);
        calculateStats(propCompanies);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('companies')
          .select('id, company_name, location, industry, employees')
          .not('location', 'is', null);

        if (error) throw error;

        const companiesWithCoords = (data || [])
          .map(c => ({
            id: c.id,
            name: c.company_name,
            location: c.location as any,
            industry: c.industry,
            employees: c.employees
          }))
          .filter(c => 
            c.location?.lat && c.location?.lng
          ) as Company[];

        setCompanies(companiesWithCoords);
        calculateStats(companiesWithCoords);
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
        toast.error('Erro ao carregar empresas do mapa');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [propCompanies]);

  // Calcular estatísticas
  const calculateStats = (comps: Company[]) => {
    const byState: Record<string, number> = {};
    let withLocation = 0;

    comps.forEach(c => {
      if (c.location?.lat && c.location?.lng) {
        withLocation++;
        const state = c.location.state || 'Outro';
        byState[state] = (byState[state] || 0) + 1;
      }
    });

    setStats({
      total: comps.length,
      withLocation,
      byState
    });
  };

  // Centro padrão: Brasil (São Paulo)
  const defaultCenter: [number, number] = [-23.5505, -46.6333];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Empresas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
            <p className="text-muted-foreground text-center">
              Nenhuma empresa com localização disponível<br/>
              <span className="text-xs">Adicione endereços às empresas para visualizá-las no mapa</span>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Mapa de Empresas
        </CardTitle>
        {showStats && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {stats.withLocation} empresas no mapa
            </div>
            {stats.total > stats.withLocation && (
              <span className="text-xs">
                ({stats.total - stats.withLocation} sem localização)
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden">
          <MapContainer
            center={companies[0]?.location?.lat && companies[0]?.location?.lng 
              ? [companies[0].location.lat, companies[0].location.lng] 
              : defaultCenter
            }
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {companies.map((company) => {
              if (!company.location?.lat || !company.location?.lng) return null;
              
              return (
                <Marker
                  key={company.id}
                  position={[company.location.lat, company.location.lng]}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-sm mb-1">{company.name}</h3>
                      {company.industry && (
                        <p className="text-xs text-muted-foreground mb-1">{company.industry}</p>
                      )}
                      {company.location.city && (
                        <p className="text-xs">
                          📍 {company.location.city}, {company.location.state}
                        </p>
                      )}
                      {company.employees && (
                        <p className="text-xs">
                          👥 {company.employees} funcionários
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Estatísticas por estado */}
        {showStats && Object.keys(stats.byState).length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(stats.byState)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([state, count]) => (
                <div key={state} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                  <span>{state}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

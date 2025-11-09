import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Fix Leaflet default marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapProps {
  address?: string;
  numero?: string;
  municipio?: string;
  estado?: string;
  cep?: string;
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

export default function LocationMap({
  address,
  numero,
  municipio,
  estado,
  cep,
  onLocationSelect
}: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const circle = useRef<L.Circle | null>(null);
  const [loading, setLoading] = useState(false);

  // Inicializar mapa Leaflet (GRATUITO - OpenStreetMap)
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    console.log('🗺️ Inicializando mapa Leaflet (OpenStreetMap - GRATUITO)...');

    // Aguardar DOM estar pronto
    setTimeout(() => {
      if (!mapContainer.current) return;
      
      try {
        map.current = L.map(mapContainer.current).setView([-15.7942, -47.8825], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map.current);

        console.log('✅ Mapa Leaflet inicializado!');
      } catch (error) {
        console.error('❌ Erro ao inicializar Leaflet:', error);
      }
    }, 100);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Geocodificar endereço usando Nominatim (GRATUITO)
  useEffect(() => {
    // Aguardar mapa estar 100% pronto
    const timer = setTimeout(async () => {
      if (!map.current) {
        console.log('⏳ Mapa ainda não inicializado');
        return;
      }

      const geocodeAddress = async () => {
      const hasCep = cep && cep.replace(/\D/g, '').length === 8;
      const hasNumero = numero && numero.trim().length > 0;
      
      setLoading(true);

      // PRIORIDADE 1: CEP brasileiro (ViaCEP + Nominatim)
      if (hasCep) {
        const cleanCep = cep.replace(/\D/g, '');
        console.log('📍 Buscando coordenadas por CEP:', cleanCep);

        try {
          // Tentar ViaCEP primeiro (mais preciso no Brasil)
          const viaCepResponse = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const viaCepData = await viaCepResponse.json();

          if (!viaCepData.erro) {
            // ViaCEP retornou, agora buscar lat/lng no Nominatim
            const fullAddress = `${viaCepData.logradouro || address || ''}, ${numero || ''}, ${viaCepData.bairro || ''}, ${viaCepData.localidade || municipio}, ${viaCepData.uf || estado}, Brasil`.replace(/\s+/g, ' ').trim();
            console.log('📍 Geocodificando endereço completo:', fullAddress);

            const nomResponse = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1&countrycodes=br`
            );
            const nomData = await nomResponse.json();

            if (nomData && nomData.length > 0) {
              const { lat, lon } = nomData[0];
              const latNum = parseFloat(lat);
              const lngNum = parseFloat(lon);

              console.log('✅ Localização PRECISA encontrada (ViaCEP + Nominatim):', { lat: latNum, lng: lngNum });

              if (!map.current) return;

              map.current.setView([latNum, lngNum], hasNumero ? 18 : 16);

              // Remover marcadores anteriores
              if (marker.current) marker.current.remove();
              if (circle.current) circle.current.remove();

              if (hasNumero) {
                // Pin preciso no número exato
                marker.current = L.marker([latNum, lngNum]).addTo(map.current);
              } else {
                // Círculo na área do CEP
                circle.current = L.circle([latNum, lngNum], {
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.2,
                  radius: 100,
                }).addTo(map.current);
              }

              if (onLocationSelect) {
                onLocationSelect({ lat: latNum, lng: lngNum });
              }

              setLoading(false);
              return;
            }
          }
        } catch (error) {
          console.warn('⚠️ ViaCEP falhou, usando Nominatim direto:', error);
        }
      }

      // FALLBACK: Nominatim direto
      let searchText = '';
      let zoomLevel = 6;
      let showAreaCircle = false;

      if (hasNumero && address) {
        searchText = `${address}, ${numero}, ${municipio}, ${estado}, Brasil`;
        zoomLevel = 18;
        showAreaCircle = false;
      } else if (municipio && estado) {
        searchText = `${municipio}, ${estado}, Brasil`;
        zoomLevel = 12;
        showAreaCircle = true;
      } else if (estado) {
        searchText = `${estado}, Brasil`;
        zoomLevel = 8;
        showAreaCircle = true;
      } else {
        setLoading(false);
        return;
      }

      console.log('📍 Geocodificando (Nominatim fallback):', searchText);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchText)}&format=json&limit=1&countrycodes=br`
        );
        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const latNum = parseFloat(lat);
          const lngNum = parseFloat(lon);

          console.log('✅ Localização encontrada:', { lat: latNum, lng: lngNum });

          // Verificar se mapa ainda existe antes de usar
          if (!map.current) {
            console.error('❌ Mapa foi destruído antes do setView');
            return;
          }

          map.current.setView([latNum, lngNum], zoomLevel);

          // Remover marcadores anteriores
          if (marker.current) {
            marker.current.remove();
            marker.current = null;
          }
          if (circle.current) {
            circle.current.remove();
            circle.current = null;
          }

          if (showAreaCircle) {
            // Mostrar círculo de área
            const radiusMap: Record<number, number> = {
              6: 15000,
              8: 10000,
              12: 3000,
              16: 500,
            };
            const radius = radiusMap[zoomLevel] || 1000;

            circle.current = L.circle([latNum, lngNum], {
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
              radius: radius,
            }).addTo(map.current!);
          } else {
            // Mostrar pin preciso
            marker.current = L.marker([latNum, lngNum]).addTo(map.current!);
          }

          if (onLocationSelect) {
            onLocationSelect({ lat: latNum, lng: lngNum });
          }
        }
      } catch (error) {
        console.error('❌ Erro ao geocodificar:', error);
      } finally {
        setLoading(false);
      }
      };

      await geocodeAddress();
    }, 500); // Delay de 500ms para garantir inicialização

    return () => clearTimeout(timer);
  }, [address, numero, municipio, estado, cep, onLocationSelect]);

  return (
    <Card className="relative w-full h-[360px] overflow-hidden bg-slate-100 dark:bg-slate-900">
      <div ref={mapContainer} className="absolute inset-0 z-0" style={{ background: '#e5e7eb' }} />
      
      {loading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* Debug Info */}
      <div className="absolute top-2 left-2 z-[1000] bg-black/70 text-white text-xs p-2 rounded">
        <p>📍 {municipio || 'N/A'}, {estado || 'N/A'}</p>
        <p>🗺️ Leaflet + OSM</p>
      </div>
    </Card>
  );
}

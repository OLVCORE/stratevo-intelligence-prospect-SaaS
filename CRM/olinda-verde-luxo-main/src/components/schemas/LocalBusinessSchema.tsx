type Props = {
  name?: string;
  description?: string;
  telephone?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
};

export default function LocalBusinessSchema({
  name = "Espaço Olinda",
  description = "Espaço de eventos premium em Santa Isabel (SP), ideal para casamentos, celebrações e eventos corporativos, com área verde e opções de hospedagem.",
  telephone = "+55-11-2675-1446",
  aggregateRating,
}: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": ["EventVenue", "LocalBusiness"],
    name,
    description,
    image: `${window.location.origin}/og-image.jpg`,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Estrada da Pedra Branca, Km 1,5 - Rua C",
        addressLocality: "Santa Isabel",
        addressRegion: "SP",
        addressCountry: "BR",
      },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "-23.3167",
      longitude: "-46.2208",
    },
    url: window.location.origin,
    telephone,
    priceRange: "R$ 15.000 - R$ 40.000",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "09:00",
        closes: "22:00",
      },
    ],
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Estacionamento interno", value: true },
      { "@type": "LocationFeatureSpecification", name: "Acessibilidade", value: true },
      { "@type": "LocationFeatureSpecification", name: "Hospedagem no local", value: true },
      { "@type": "LocationFeatureSpecification", name: "Wi-Fi", value: true },
    ],
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: "-23.5505",
        longitude: "-46.6333",
      },
      geoRadius: "100000",
    },
    ...(aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: String(aggregateRating.ratingValue),
        reviewCount: String(aggregateRating.reviewCount),
        bestRating: "5",
        worstRating: "1",
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

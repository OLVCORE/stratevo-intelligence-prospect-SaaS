type Props = {
  eventType: "Wedding" | "BusinessEvent";
  name: string;
  description: string;
  offers?: {
    name: string;
    price: string;
    priceCurrency: string;
  }[];
};

export default function EventSchema({ eventType, name, description, offers }: Props) {
  const schema = {
    "@context": "https://schema.org",
    "@type": eventType === "Wedding" ? "Event" : "BusinessEvent",
    name,
    description,
    location: {
      "@type": "EventVenue",
      name: "Espaço Olinda",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Santa Isabel",
        addressRegion: "SP",
        addressCountry: "BR",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Espaço Olinda",
      url: window.location.origin,
    },
    ...(offers && {
      offers: offers.map((offer) => ({
        "@type": "Offer",
        name: offer.name,
        price: offer.price,
        priceCurrency: offer.priceCurrency,
        availability: "https://schema.org/InStock",
        url: window.location.href,
      })),
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

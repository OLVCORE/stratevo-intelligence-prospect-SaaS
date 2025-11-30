import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import Gallery from "@/components/Gallery";
import VideoGallery from "@/components/VideoGallery";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import LocalBusinessSchema from "@/components/schemas/LocalBusinessSchema";

const Index = () => {
  return (
    <div className="min-h-screen">
      <LocalBusinessSchema
        aggregateRating={{
          ratingValue: 4.9,
          reviewCount: 500,
        }}
      />
      <Header />
      <Hero />
      <Services />
      <Gallery />
      <VideoGallery />
      <Features />
      <Testimonials />
      <CTASection />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;

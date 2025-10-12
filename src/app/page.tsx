import Navigation from "~/components/Navigation";
import Hero from "~/components/HeroFloating";
import TrustLogos from "~/components/TrustLogos";
import Testimonials from "~/components/Testimonials";
import CTA from "~/components/CTA";
import Footer from "~/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <div className="dotted-background" />
      <Navigation />
      <Hero />
      <div className="mt-8 sm:mt-12 md:mt-16">
        <TrustLogos />
      </div>
      <div className="mt-8 sm:mt-12 md:mt-16">
        <Testimonials />
      </div>
      <div className="mt-8 sm:mt-12 md:mt-16">
        <CTA />
      </div>
      <div className="mt-8 sm:mt-12 md:mt-16">
        <Footer />
      </div>
    </main>
  );
}

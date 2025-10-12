// This template requires the Embla Auto Scroll plugin to be installed:
//
// npm install embla-carousel-auto-scroll

"use client";

import AutoScroll from "embla-carousel-auto-scroll";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "~/components/ui/carousel";

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

interface Logos3Props {
  heading?: string;
  logos?: Logo[];
  className?: string;
}

const Logos3 = ({
  heading = "Trusted by Veterinary Practices & Integrated with Leading Systems",
  logos = [
    {
      id: "logo-1",
      description: "AVImark",
      image: "/logos/avimark.png",
      className: "h-12 w-auto max-w-[120px]",
    },
    {
      id: "logo-2",
      description: "Vetspire",
      image: "/logos/vetspire.png",
      className: "h-12 w-auto max-w-[120px]",
    },
    {
      id: "logo-3",
      description: "ezyVet",
      image: "/logos/ezyvet.png",
      className: "h-12 w-auto max-w-[120px]",
    },
    {
      id: "logo-4",
      description: "IDEXX Neo",
      image: "/logos/idexx-neo.svg",
      className: "h-12 w-auto max-w-[120px]",
    },
    {
      id: "logo-5",
      description: "IDEXX Cornerstone",
      image: "/logos/idexx-cornerstone.png",
      className: "h-12 w-auto max-w-[120px]",
    },
    {
      id: "logo-6",
      description: "Digitail",
      image: "/logos/digitail.png",
      className: "h-12 w-auto max-w-[120px]",
    },
  ],
}: Logos3Props) => {
  // Duplicate logos for seamless loop
  const duplicatedLogos = [...logos, ...logos, ...logos];

  return (
    <section className="overflow-hidden bg-gradient-to-b from-emerald-50/20 via-emerald-50/30 to-emerald-50/20 py-20 sm:py-24 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="font-display mb-16 text-center text-2xl font-bold text-gray-600 sm:text-3xl md:text-4xl lg:text-5xl">
          {heading}
        </h2>
        <div className="relative w-full">
          <Carousel
            opts={{
              loop: true,
              align: "start",
              dragFree: true,
            }}
            plugins={[
              AutoScroll({
                playOnInit: true,
                speed: 1,
                stopOnInteraction: false,
                stopOnMouseEnter: false,
                stopOnFocusIn: false,
              }),
            ]}
            className="w-full"
          >
            <CarouselContent className="ml-0">
              {duplicatedLogos.map((logo, index) => (
                <CarouselItem
                  key={`${logo.id}-${index}`}
                  className="flex min-w-[200px] basis-auto justify-center pl-0"
                >
                  <div className="flex shrink-0 items-center justify-center px-8">
                    <img
                      src={logo.image}
                      alt={logo.description}
                      className={`${logo.className} opacity-60 grayscale filter transition-opacity hover:opacity-100`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-emerald-50/20 to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-emerald-50/20 to-transparent"></div>
        </div>
      </div>
    </section>
  );
};

export { Logos3 };

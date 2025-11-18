import { ImageWithFallback } from "./figma/ImageWithFallback";
import featuredImage from "figma:asset/70de77a5eb19f26dfe79c7f018b700d6b769cb71.png";
import logoobject from "figma:asset/83cadf5ee588fa461b564c6bfb944eeecdaa12c6.png";

export function FeaturedSection() {
  const bagImage = featuredImage;

  return (
    <div className="bg-[rgb(82,37,37)] text-brand-cream py-20 pb-8 relative overflow-hidden">
      {/* Curved cream background - larger */}
      <div className="absolute bottom-0 left-0 right-0 h-[450px] bg-brand-cream rounded-t-[50%]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4">
        {/* Bag Image with circular background */}
        <div className="flex justify-center mb-16 mt-16">
          <div className="relative w-[400px] h-[500px] flex items-center justify-center overflow-hidden">
            {/* Frame: rounded top + rectangular bottom */}
            <div className="absolute inset-0 w-full h-full bg-brand-warm-taupe rounded-t-full" />
            
            {/* Image */}
            <ImageWithFallback
              src={bagImage}
              alt="LUNE Fashion"
              className="absolute inset-0 w-full h-full object-cover rounded-t-full"
            />
            
            {/* Logo - always displayed at bottom */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
              <img
                src={logoobject}
                alt="LUNE Logo"
                className="h-[3.9rem] w-auto"
              />
            </div>
          </div>
        </div>

        {/* Brand Title */}
        <div className="text-center mb-4 relative z-10">
          <h3 className="text-sm tracking-[0.3em] text-brand-terra-cotta font-bold text-[24px]">
            TIMELESS FASHION BRAND
          </h3>
        </div>

        {/* Brand Description */}
        <div className="text-center relative z-10 pb-4 mb-12">
          <p className="leading-relaxed tracking-wide text-brand-terra-cotta/90 max-w-2xl mx-auto text-[16px]">
            inspired by parisian chic and crafted with attention to detail,
            <br />
            for women who appreciate modern sophistication and timeless design.
            <br />
            lune offers curated essentials for every occasion.
          </p>
        </div>
      </div>
    </div>
  );
}
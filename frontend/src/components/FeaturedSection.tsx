import { ImageWithFallback } from "./figma/ImageWithFallback";
import featuredImage from "figma:asset/70de77a5eb19f26dfe79c7f018b700d6b769cb71.png";
import logoobject from "figma:asset/83cadf5ee588fa461b564c6bfb944eeecdaa12c6.png";

export function FeaturedSection() {
  const bagImage = featuredImage;

  return (
    <div className="bg-[rgb(82,37,37)] text-brand-cream py-20 mobile-py-12 pb-8 mobile-pb-6 relative overflow-hidden">
      {/* Curved cream background - larger */}
      <div className="absolute bottom-0 left-0 right-0 h-[450px] mobile-h-300 bg-brand-cream rounded-t-[50%]" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 mobile-px-3">
        {/* Bag Image with circular background */}
        <div className="flex justify-center mb-16 mobile-mb-8 mt-16 mobile-mt-8">
          <div className="relative w-[400px] mobile-w-300 h-[500px] mobile-h-375 flex items-center justify-center overflow-hidden">
            {/* Frame: rounded top + rectangular bottom */}
            <div className="absolute inset-0 w-full h-full bg-brand-warm-taupe rounded-t-full" />
            
            {/* Image */}
            <ImageWithFallback
              src={bagImage}
              alt="LUNE Fashion"
              className="absolute inset-0 w-full h-full object-cover rounded-t-full"
            />
            
            {/* Logo - always displayed at bottom */}
            <div className="absolute bottom-8 mobile-bottom-6 left-1/2 -translate-x-1/2 z-10">
              <img
                src={logoobject}
                alt="LUNE Logo"
                className="h-[3.9rem] mobile-h-2-5rem w-auto"
              />
            </div>
          </div>
        </div>

        {/* Brand Title */}
        <div className="text-center mb-4 mobile-mb-3 relative z-10">
          <h3 className="text-sm tracking-[0.3em] text-brand-terra-cotta font-bold text-[24px] mobile-text-18px">
            TIMELESS FASHION BRAND
          </h3>
        </div>

        {/* Brand Description */}
        <div className="text-center relative z-10 pb-4 mobile-pb-3 mb-12 mobile-mb-8">
          <p className="leading-relaxed tracking-wide text-brand-terra-cotta/90 max-w-2xl mx-auto text-[16px] mobile-text-14">
            inspired by parisian chic and crafted with attention to detail,
            <br className="mobile-hidden" />
            <span className="mobile-block mobile-mt-1" />
            for women who appreciate modern sophistication and timeless design.
            <br className="mobile-hidden" />
            <span className="mobile-block mobile-mt-1" />
            lune offers curated essentials for every occasion.
          </p>
        </div>
      </div>
    </div>
  );
}
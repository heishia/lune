import brandBox from "figma:asset/818618629d95b6172c05361b3a3c35110f342dd0.png";
import brandTags from "figma:asset/65b220ed57f6837f2d0025f3cbff03e23f99594b.png";
import brandCards from "figma:asset/e4753700b89b56304b3565b3625ebc9ecce21062.png";

export function CategorySection() {
  const brandImages = [
    { image: brandBox, alt: "LUNE Brand Box" },
    { image: brandTags, alt: "LUNE Brand Tags" },
    { image: brandCards, alt: "LUNE Brand Cards" },
  ];

  return (
    <section className="bg-brand-cream py-8 pt-4 pb-32">
      <div className="max-w-5xl mx-auto px-6">
        {/* Brand Images - 3 images in a row */}
        <div className="mb-32">
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {brandImages.map((item, index) => (
              <div key={index} className="group">
                <div className="relative overflow-hidden aspect-[4/5] rounded-sm bg-white">
                  <img
                    src={item.image}
                    alt={item.alt}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-2">
            <span className="text-[24px] tracking-[0.3em] text-brand-terra-cotta font-bold">
              BRAND VALUES
            </span>
          </div>
        </div>

        {/* Triangle Design with Values */}
        <div className="mb-0 flex justify-center">
          <div className="grid grid-cols-3 gap-16 max-w-6xl mx-auto px-8">
            {/* Quality Triangle */}
            <div className="flex flex-col items-center gap-4">
              <svg viewBox="0 0 120 104" className="w-full h-auto max-w-[240px]">
                <polygon 
                  points="60,0 120,104 0,104" 
                  fill="#8A7B6F"
                />
                <text x="60" y="70" textAnchor="middle" fill="white" fontSize="8" letterSpacing="2" fontWeight="300" opacity="0.95">
                  QUALITY
                </text>
              </svg>
            </div>

            {/* Elegance Triangle */}
            <div className="flex flex-col items-center gap-4">
              <svg viewBox="0 0 120 104" className="w-full h-auto max-w-[240px]">
                <polygon 
                  points="60,0 120,104 0,104" 
                  fill="#9E6565"
                />
                <text x="60" y="70" textAnchor="middle" fill="white" fontSize="8" letterSpacing="2" fontWeight="300" opacity="0.95">
                  ELEGANCE
                </text>
              </svg>
            </div>

            {/* Curated Triangle */}
            <div className="flex flex-col items-center gap-4">
              <svg viewBox="0 0 120 104" className="w-full h-auto max-w-[240px]">
                <polygon 
                  points="60,0 120,104 0,104" 
                  fill="#9D8D7F"
                />
                <text x="60" y="70" textAnchor="middle" fill="white" fontSize="8" letterSpacing="2" fontWeight="300" opacity="0.95">
                  CURATED
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
import { useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import secondImage from "figma:asset/0ec7341481d488ecec0fdf0eea88fe44d151a4d4.png";
import thirdImage from "figma:asset/0da1f127e25e5c095e28b9a0e6be10c908be5b9e.png";
import beigeDress from "figma:asset/6c5a8768691d29c70bd50a6c0a5e5b7d20a062a8.png";

export function HeroSection() {
  const heroImages = [
    {
      src: secondImage,
      alt: "LUNE Fashion Collection",
    },
    {
      src: beigeDress,
      alt: "Beige minimalist dress",
    },
    {
      src: thirdImage,
      alt: "LUNE Beige Heels",
    },
    {
      src: secondImage,
      alt: "LUNE Fashion Collection",
    },
    {
      src: beigeDress,
      alt: "Beige minimalist dress",
    },
    {
      src: thirdImage,
      alt: "LUNE Beige Heels",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const maxIndex = heroImages.length - 3; // 3개씩 보이므로 마지막에서 3개 전까지만

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? 0 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === maxIndex ? maxIndex : prev + 1));
  };

  return (
    <div className="mt-48 mobile-mt-24 bg-[rgb(82,37,37)] px-4 mobile-px-3 py-8 mobile-py-6 relative">
      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <div
          className="flex gap-4 mobile-flex-col mobile-gap-6 transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
        >
          {heroImages.map((image, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[calc(33.33%-10.67px)] mobile-w-full"
            >
              <ImageWithFallback
                src={image.src}
                alt={image.alt}
                className="w-full aspect-[3/4] mobile-aspect-4-5 object-cover rounded-[0px]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
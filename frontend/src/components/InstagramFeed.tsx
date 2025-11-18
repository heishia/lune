import { useState, useEffect } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface InstagramMedia {
  id: string;
  imageUrl: string;
  caption: string;
  permalink: string;
}

export function InstagramFeed() {
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [mediaItems, setMediaItems] = useState<InstagramMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstagramMedia();
  }, []);

  const fetchInstagramMedia = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84/instagram/media`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFeaturedImage(data.featuredImageUrl);
        setMediaItems(data.media || []);
      } else {
        // Instagram 연동 안됨 - 기본 이미지 사용
        useFallbackImages();
      }
    } catch (error) {
      console.error("Error fetching Instagram media:", error);
      useFallbackImages();
    } finally {
      setLoading(false);
    }
  };

  const useFallbackImages = () => {
    // Instagram 연동 전 기본 이미지
    const feedImages = [
      {
        id: 1,
        image: "https://images.unsplash.com/photo-1629922949137-e236a5ab497d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwd29tZW4lMjBmYXNoaW9ufGVufDF8fHx8MTc2MTM1MDcyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        text: "EVERYDAY ESSENTIALS",
        size: "large",
      },
      {
        id: 2,
        image: "https://images.unsplash.com/photo-1759229874914-c1ffdb3ebd0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0JTIwYmVpZ2UlMjBjbG90aGluZ3xlbnwxfHx8fDE3NjEzNTA3MjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        text: "TIMELESS ELEGANCE",
        size: "small",
      },
      {
        id: 3,
        image: "https://images.unsplash.com/photo-1631541911232-72bc7448820a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMGtuaXQlMjBzd2VhdGVyfGVufDF8fHx8MTc2MTM1MDcxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        text: "MODERN ROMANCE",
        size: "small",
      },
      {
        id: 4,
        image: "https://images.unsplash.com/photo-1632469188022-b5db09a70fbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMGZhc2hpb24lMjBmbGF0JTIwbGF5fGVufDF8fHx8MTc2MTM1MDcxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        text: "CURATED COLLECTION",
        size: "small",
      },
      {
        id: 5,
        image: "https://images.unsplash.com/photo-1562986398-ef6efbbc9537?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXV0cmFsJTIwY2FyZGlnYW4lMjBmYXNoaW9ufGVufDF8fHx8MTc2MTM1MDcxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        text: "WINTER WARMTH",
        size: "small",
      },
      {
        id: 6,
        image: "https://images.unsplash.com/photo-1676808373053-de1f0f9b2119?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXV0cmFsJTIwd29tZW4lMjBzaG9lc3xlbnwxfHx8fDE3NjEzNTA3MTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        text: "CHIC MINIMALISM",
        size: "small",
      },
    ];

    setFeaturedImage(feedImages[0].image);
    setMediaItems(feedImages.slice(1) as InstagramMedia[]);
  };

  return (
    <div className="bg-brand-cream py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* First large image */}
          <div className="md:row-span-2 relative group cursor-pointer overflow-hidden rounded-lg">
            <ImageWithFallback
              src={featuredImage || ""}
              alt="Featured Image"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-brand-terra-cotta/20 group-hover:bg-brand-terra-cotta/30 transition-colors" />
            <div className="absolute bottom-4 left-4 right-4 text-brand-cream">
              <p className="text-[10px] tracking-wider">FEATURED IMAGE</p>
            </div>
          </div>

          {/* Smaller images */}
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square"
            >
              <ImageWithFallback
                src={item.imageUrl}
                alt={item.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-brand-terra-cotta/20 group-hover:bg-brand-terra-cotta/30 transition-colors" />
              <div className="absolute bottom-3 left-3 right-3 text-brand-cream">
                <p className="text-[9px] tracking-wider">{item.caption}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Instagram Link */}
        <div className="text-center mt-8">
          <p className="text-xs tracking-widest text-brand-warm-taupe">@ LUNE_OFFICIAL</p>
        </div>
      </div>
    </div>
  );
}
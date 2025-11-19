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
      // 개발 환경에서는 로컬 백엔드 사용, 프로덕션에서는 Supabase Edge Function 사용
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:8000/instagram/media'
        : `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84/instagram/media`;
      
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${publicAnonKey}`,
        },
      });

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
    const feedImages: InstagramMedia[] = [
      {
        id: "1",
        imageUrl: "https://images.unsplash.com/photo-1629922949137-e236a5ab497d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwd29tZW4lMjBmYXNoaW9ufGVufDF8fHx8MTc2MTM1MDcyMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        caption: "EVERYDAY ESSENTIALS",
        permalink: "#",
      },
      {
        id: "2",
        imageUrl: "https://images.unsplash.com/photo-1759229874914-c1ffdb3ebd0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0JTIwYmVpZ2UlMjBjbG90aGluZ3xlbnwxfHx8fDE3NjEzNTA3MjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        caption: "TIMELESS ELEGANCE",
        permalink: "#",
      },
      {
        id: "3",
        imageUrl: "https://images.unsplash.com/photo-1631541911232-72bc7448820a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMGtuaXQlMjBzd2VhdGVyfGVufDF8fHx8MTc2MTM1MDcxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        caption: "MODERN ROMANCE",
        permalink: "#",
      },
      {
        id: "4",
        imageUrl: "https://images.unsplash.com/photo-1632469188022-b5db09a70fbc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMGZhc2hpb24lMjBmbGF0JTIwbGF5fGVufDF8fHx8MTc2MTM1MDcxOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        caption: "CURATED COLLECTION",
        permalink: "#",
      },
      {
        id: "5",
        imageUrl: "https://images.unsplash.com/photo-1562986398-ef6efbbc9537?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXV0cmFsJTIwY2FyZGlnYW4lMjBmYXNoaW9ufGVufDF8fHx8MTc2MTM1MDcxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        caption: "WINTER WARMTH",
        permalink: "#",
      },
      {
        id: "6",
        imageUrl: "https://images.unsplash.com/photo-1676808373053-de1f0f9b2119?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXV0cmFsJTIwd29tZW4lMjBzaG9lc3xlbnwxfHx8fDE3NjEzNTA3MTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
        caption: "CHIC MINIMALISM",
        permalink: "#",
      },
    ];

    setFeaturedImage(feedImages[0].imageUrl);
    setMediaItems(feedImages.slice(1));
  };

  return (
    <div className="bg-brand-cream py-8 mobile-py-6">
      <div className="max-w-6xl mx-auto px-4 mobile-px-3">
        {/* Grid Layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 mobile-grid-cols-1 gap-3 mobile-gap-4">
          {/* First large image */}
          <div className="md:row-span-2 mobile-row-span-1 relative group cursor-pointer overflow-hidden rounded-lg aspect-square mobile-aspect-[4/3]">
            <ImageWithFallback
              src={featuredImage || ""}
              alt="Featured Image"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-brand-terra-cotta/20 group-hover:bg-brand-terra-cotta/30 transition-colors" />
            <div className="absolute bottom-4 left-4 right-4 mobile-bottom-3 mobile-left-3 mobile-right-3 text-brand-cream">
              <p className="text-[10px] tracking-wider">FEATURED IMAGE</p>
            </div>
          </div>

          {/* Smaller images */}
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="relative group cursor-pointer overflow-hidden rounded-lg aspect-square mobile-aspect-[4/3]"
            >
              <ImageWithFallback
                src={item.imageUrl}
                alt={item.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-brand-terra-cotta/20 group-hover:bg-brand-terra-cotta/30 transition-colors" />
              <div className="absolute bottom-3 left-3 right-3 text-brand-cream">
                <p className="text-[9px] mobile-text-10px tracking-wider">{item.caption}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Instagram Link */}
        <div className="text-center mt-8 mobile-mt-6">
          <p className="text-xs tracking-widest text-brand-warm-taupe">@ LUNE_OFFICIAL</p>
        </div>
      </div>
    </div>
  );
}
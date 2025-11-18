export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string[];
  description: string;
  colors: string[];
  sizes: string[];
  isNew?: boolean;
  isBest?: boolean;
}

export const products: Product[] = [
  // TOPS
  {
    id: 1,
    name: "SILK BLEND BLOUSE",
    price: 89000,
    originalPrice: 120000,
    image: "https://images.unsplash.com/photo-1645654731316-a350fdcf3bae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHNpbGslMjBibG91c2V8ZW58MXx8fHwxNzYxMzUxOTQwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["TOP", "BEST"],
    description: "고급스러운 실크 블렌드 소재의 베이지 블라우스입니다. 데일리부터 오피스룩까지 활용도 높은 아이템.",
    colors: ["Beige", "Ivory"],
    sizes: ["S", "M", "L"],
    isBest: true,
  },
  {
    id: 2,
    name: "COZY KNIT SWEATER",
    price: 68900,
    image: "https://images.unsplash.com/photo-1631541911232-72bc7448820a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMGtuaXQlMjBzd2VhdGVyfGVufDF8fHx8MTc2MTM1MDcxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["TOP", "BEST"],
    description: "부드러운 촉감의 니트 스웨터. 따뜻하면서도 세련된 디자인.",
    colors: ["Beige", "Cream"],
    sizes: ["S", "M", "L"],
    isBest: true,
  },
  {
    id: 3,
    name: "SOFT CREAM BLOUSE",
    price: 52900,
    image: "https://images.unsplash.com/photo-1562437636-91b3c04d723c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhbSUyMGJsb3VzZSUyMHdvbWVufGVufDF8fHx8MTc2MTM1MDcxN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["TOP", "NEW"],
    description: "부드러운 크림 컬러의 블라우스. 여성스러운 실루엣이 돋보입니다.",
    colors: ["Cream", "White"],
    sizes: ["S", "M", "L"],
    isNew: true,
  },
  {
    id: 4,
    name: "CREAM KNIT TOP",
    price: 59000,
    image: "https://images.unsplash.com/photo-1680818083394-fdbddd0dd984?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhbSUyMGtuaXQlMjB0b3B8ZW58MXx8fHwxNzYxMzUxOTQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["TOP"],
    description: "데일리 착용하기 좋은 크림 니트 탑. 심플하고 세련된 디자인.",
    colors: ["Cream", "Beige"],
    sizes: ["S", "M", "L", "XL"],
    isNew: true,
  },

  // BOTTOMS
  {
    id: 5,
    name: "WIDE LEG PANTS",
    price: 79000,
    image: "https://images.unsplash.com/photo-1602585198422-d795fa9bfd6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXV0cmFsJTIwd2lkZSUyMHBhbnRzfGVufDF8fHx8MTc2MTM1MTk0MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["BOTTOM", "BEST"],
    description: "편안하면서도 우아한 와이드 레그 팬츠. 다양한 상의와 매치 가능합니다.",
    colors: ["Beige", "Taupe", "Black"],
    sizes: ["S", "M", "L"],
    isBest: true,
  },
  {
    id: 6,
    name: "PLEATED MIDI SKIRT",
    price: 69000,
    originalPrice: 89000,
    image: "https://images.unsplash.com/photo-1527614092500-739b1a574173?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHBsZWF0ZWQlMjBza2lydHxlbnwxfHx8fDE3NjEzNTE5NDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["BOTTOM", "BEST"],
    description: "우아한 플리츠 미디 스커트. 여성스러운 실루엣이 아름답습니다.",
    colors: ["Beige", "Cream"],
    sizes: ["S", "M", "L"],
    isBest: true,
  },
  {
    id: 7,
    name: "LINEN WIDE PANTS",
    price: 75000,
    image: "https://images.unsplash.com/photo-1696889450800-e94ec7a32206?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhbSUyMGxpbmVuJTIwcGFudHN8ZW58MXx8fHwxNzYxMzUxOTQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["BOTTOM", "NEW"],
    description: "시원한 린넨 소재의 와이드 팬츠. 여름에 완벽한 아이템입니다.",
    colors: ["Cream", "White", "Beige"],
    sizes: ["S", "M", "L"],
    isNew: true,
  },

  // ONEPIECE
  {
    id: 8,
    name: "MIDI WRAP DRESS",
    price: 129000,
    image: "https://images.unsplash.com/photo-1583333001978-8c57d752ce5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhbSUyMG1pZGklMjBkcmVzc3xlbnwxfHx8fDE3NjEzNTE5NDF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["ONEPIECE", "BEST"],
    description: "우아한 랩 디자인의 미디 드레스. 특별한 날에 완벽한 선택입니다.",
    colors: ["Cream", "Beige"],
    sizes: ["S", "M", "L"],
    isBest: true,
  },
  {
    id: 9,
    name: "BEIGE MAXI DRESS",
    price: 149000,
    image: "https://images.unsplash.com/photo-1636924003227-1895fc75857e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMG1heGklMjBkcmVzc3xlbnwxfHx8fDE3NjEzNTE5NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["ONEPIECE", "NEW"],
    description: "로맨틱한 베이지 맥시 드레스. 휴양지부터 파티까지 다양하게 활용 가능.",
    colors: ["Beige", "Taupe"],
    sizes: ["S", "M", "L"],
    isNew: true,
  },
  {
    id: 10,
    name: "MINIMALIST DRESS",
    price: 98000,
    image: "https://images.unsplash.com/photo-1592327877233-90b9bfd92e48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMGRyZXNzJTIwbWluaW1hbHxlbnwxfHx8fDE3NjEzNTA2NDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["ONEPIECE", "BEST"],
    description: "미니멀한 디자인의 베이지 드레스. 타임리스한 매력을 자랑합니다.",
    colors: ["Beige", "Cream"],
    sizes: ["S", "M", "L"],
    isBest: true,
  },

  // SET
  {
    id: 11,
    name: "NEUTRAL MATCHING SET",
    price: 135000,
    originalPrice: 165000,
    image: "https://images.unsplash.com/photo-1626200115283-4c0c73f0f4f7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXV0cmFsJTIwbWF0Y2hpbmclMjBzZXR8ZW58MXx8fHwxNzYxMzUxOTQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["SET", "BEST"],
    description: "세트로 입으면 더욱 완벽한 코디. 따로 입어도 활용도 높습니다.",
    colors: ["Beige", "Cream"],
    sizes: ["S", "M", "L"],
    isBest: true,
  },
  {
    id: 12,
    name: "BEIGE AESTHETIC SET",
    price: 98000,
    image: "https://images.unsplash.com/photo-1666112514180-193096c14938?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMGFlc3RoZXRpYyUyMG91dGZpdHxlbnwxfHx8fDE3NjEzNTA3MTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["SET", "NEW"],
    description: "베이지 톤의 감성적인 세트룩. SNS에서 인기 폭발!",
    colors: ["Beige", "Taupe"],
    sizes: ["S", "M", "L"],
    isNew: true,
  },
  {
    id: 13,
    name: "NEUTRAL CARDIGAN SET",
    price: 115000,
    originalPrice: 145000,
    image: "https://images.unsplash.com/photo-1562986398-ef6efbbc9537?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXV0cmFsJTIwY2FyZGlnYW4lMjBmYXNoaW9ufGVufDF8fHx8MTc2MTM1MDcxOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["SET", "TOP"],
    description: "카디건과 이너가 함께 구성된 세트. 레이어드 룩에 완벽합니다.",
    colors: ["Beige", "Cream", "Taupe"],
    sizes: ["S", "M", "L"],
  },

  // SHOES
  {
    id: 14,
    name: "CLASSIC LOAFERS",
    price: 89000,
    image: "https://images.unsplash.com/photo-1646806859833-e414e02673fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMGxvYWZlcnMlMjB3b21lbnxlbnwxfHx8fDE3NjEzNTE5NDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["SHOES", "BEST"],
    description: "클래식한 디자인의 로퍼. 편안하면서도 세련된 스타일.",
    colors: ["Beige", "Black", "Brown"],
    sizes: ["230", "235", "240", "245", "250"],
    isBest: true,
  },
  {
    id: 15,
    name: "BEIGE HEELS",
    price: 98000,
    image: "https://images.unsplash.com/photo-1676808373053-de1f0f9b2119?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXV0cmFsJTIwd29tZW4lMjBzaG9lc3xlbnwxfHx8fDE3NjEzNTA3MTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["SHOES", "NEW"],
    description: "어디에나 잘 어울리는 베이지 힐. 발이 편한 7cm 굽 높이.",
    colors: ["Beige", "Nude"],
    sizes: ["230", "235", "240", "245", "250"],
    isNew: true,
  },

  // BAG & ACC
  {
    id: 16,
    name: "CLASSIC TOTE BAG",
    price: 128000,
    image: "https://images.unsplash.com/photo-1542957057-debadce4ce81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YXVwZSUyMGJhZyUyMG1pbmltYWx8ZW58MXx8fHwxNzYxMzUwNzE4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["BAG & ACC", "BEST"],
    description: "심플하면서도 고급스러운 토트백. 데일리부터 오피스까지.",
    colors: ["Taupe", "Beige", "Black"],
    sizes: ["ONE SIZE"],
    isBest: true,
  },
  {
    id: 17,
    name: "LEATHER HANDBAG",
    price: 198000,
    image: "https://images.unsplash.com/photo-1601281866896-1576541e77a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsZWF0aGVyJTIwaGFuZGJhZyUyMGJlaWdlfGVufDF8fHx8MTc2MTM1MTk0M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["BAG & ACC", "BEST"],
    description: "고급 레더 핸드백. 세련된 디자인과 뛰어난 품질.",
    colors: ["Beige", "Brown", "Black"],
    sizes: ["ONE SIZE"],
    isBest: true,
  },
  {
    id: 18,
    name: "PEARL NECKLACE",
    price: 68000,
    image: "https://images.unsplash.com/photo-1690322041787-dc67d0624a0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZWFybCUyMG5lY2tsYWNlJTIwbWluaW1hbHxlbnwxfHx8fDE3NjEzNTE5NDN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["BAG & ACC", "NEW"],
    description: "우아한 진주 목걸이. 포인트 아이템으로 완벽합니다.",
    colors: ["Pearl"],
    sizes: ["ONE SIZE"],
    isNew: true,
  },

  // OUTER
  {
    id: 19,
    name: "TRENCH COAT",
    price: 245000,
    originalPrice: 298000,
    image: "https://images.unsplash.com/photo-1633821879282-0c4e91f96232?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWlnZSUyMHRyZW5jaCUyMGNvYXR8ZW58MXx8fHwxNzYxMzAwNDA1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["TOP", "BEST"],
    description: "타임리스한 베이지 트렌치 코트. 봄/가을 필수 아이템.",
    colors: ["Beige", "Camel"],
    sizes: ["S", "M", "L"],
    isBest: true,
  },
  {
    id: 20,
    name: "SOFT BEIGE OUTFIT",
    price: 85000,
    image: "https://images.unsplash.com/photo-1759229874914-c1ffdb3ebd0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2Z0JTIwYmVpZ2UlMjBjbG90aGluZ3xlbnwxfHx8fDE3NjEzNTA3MjB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: ["TOP", "NEW"],
    description: "부드러운 베이지 톤의 편안한 아웃핏. 데일리 착용에 최적화.",
    colors: ["Beige", "Cream"],
    sizes: ["S", "M", "L"],
    isNew: true,
  },
];

// 카테고리별 상품 필터링 함수
export const getProductsByCategory = (category: string): Product[] => {
  if (category === "All") {
    return products;
  }
  if (category === "BEST") {
    return products.filter((p) => p.isBest);
  }
  if (category === "NEW") {
    return products.filter((p) => p.isNew);
  }
  return products.filter((p) => p.category.includes(category));
};

// 베스트 상품 가져오기
export const getBestProducts = (limit?: number): Product[] => {
  const bestProducts = products.filter((p) => p.isBest);
  return limit ? bestProducts.slice(0, limit) : bestProducts;
};

// 신상품 가져오기
export const getNewProducts = (limit?: number): Product[] => {
  const newProducts = products.filter((p) => p.isNew);
  return limit ? newProducts.slice(0, limit) : newProducts;
};

// ID로 상품 가져오기
export const getProductById = (id: number): Product | undefined => {
  return products.find((p) => p.id === id);
};

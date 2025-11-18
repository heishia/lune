# LUNE 브랜드 색상 가이드

## 브랜드 컬러 팔레트

LUNE의 브랜드 아이덴티티는 세 가지 핵심 색상을 기반으로 합니다.

### Primary Colors

#### Terra Cotta
- **Hex**: `#894646`
- **용도**: 주요 강조 색상, CTA 버튼, 중요 텍스트
- **설명**: 따뜻하고 세련된 테라코타 톤으로 브랜드의 럭셔리한 감성을 표현

#### Warm Taupe
- **Hex**: `#8C7B6C`
- **용도**: 보조 색상, 서브 텍스트, 경계선, 배경
- **설명**: 자연스럽고 중성적인 톤으로 편안함과 우아함을 동시에 전달

#### Cream
- **Hex**: `#F5EFE7`
- **용도**: 배경, 카드, 밝은 영역
- **설명**: 부드럽고 따뜻한 크림 톤으로 미니멀하고 깔끔한 느낌 제공

## 색상 사용 규칙

### 투명도 사용
필요에 따라 투명도 조정이 가능합니다:
- 호버 효과: 80-90% 불투명도
- 오버레이: 20-50% 불투명도
- 비활성 상태: 40-60% 불투명도

### 색상 조합 가이드
1. **배경**: Cream (#F5EFE7)
2. **주요 텍스트**: Terra Cotta (#894646)
3. **보조 텍스트/경계선**: Warm Taupe (#8C7B6C)

### 접근성
- 텍스트와 배경 간 충분한 대비를 유지
- Terra Cotta는 Cream 배경 위에서 사용 권장
- Warm Taupe는 중간 톤으로 조심스럽게 사용

## CSS 변수명
```css
--brand-terra-cotta: #894646
--brand-warm-taupe: #8C7B6C
--brand-cream: #F5EFE7
```

## Tailwind 클래스명
- `bg-brand-terra-cotta`
- `bg-brand-warm-taupe`
- `bg-brand-cream`
- `text-brand-terra-cotta`
- `text-brand-warm-taupe`
- `border-brand-warm-taupe`

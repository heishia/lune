import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Instagram, Save, Check, X } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

// 개발 환경에서는 로컬 백엔드 사용, 프로덕션에서는 Supabase Edge Function 사용
const getApiUrl = (endpoint: string) => {
  const baseUrl = import.meta.env.DEV
    ? 'http://localhost:8000'
    : `https://${projectId}.supabase.co/functions/v1/make-server-8ed17d84`;
  return `${baseUrl}${endpoint}`;
};

export function InstagramSettings() {
  const [instagramToken, setInstagramToken] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [currentFeaturedImage, setCurrentFeaturedImage] = useState("");

  // 설정 불러오기
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        getApiUrl('/instagram/settings'),
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      setHasToken(data.hasToken);
      if (data.featuredImageUrl) {
        setCurrentFeaturedImage(data.featuredImageUrl);
        setFeaturedImageUrl(data.featuredImageUrl);
      }
    } catch (error) {
      console.error("Error fetching Instagram settings:", error);
    }
  };

  const handleSaveInstagramToken = async () => {
    if (!instagramToken.trim()) {
      toast.error("Instagram Access Token을 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        getApiUrl('/instagram/settings'),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            accessToken: instagramToken,
            featuredImageUrl: featuredImageUrl || null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save Instagram settings");
      }

      toast.success("Instagram 설정이 저장되었습니다");
      setInstagramToken("");
      fetchSettings();
    } catch (error) {
      console.error("Error saving Instagram settings:", error);
      toast.error("Instagram 설정 저장에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeaturedImage = async () => {
    if (!featuredImageUrl.trim()) {
      toast.error("Featured Image URL을 입력해주세요");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        getApiUrl('/instagram/featured-image'),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            imageUrl: featuredImageUrl,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update featured image");
      }

      toast.success("Featured 이미지가 업데이트되었습니다");
      setCurrentFeaturedImage(featuredImageUrl);
    } catch (error) {
      console.error("Error updating featured image:", error);
      toast.error("Featured 이미지 업데이트에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Instagram className="w-6 h-6 text-brand-terra-cotta" />
        <h2 className="text-brand-terra-cotta">Instagram 연동 설정</h2>
      </div>

      {/* 연동 상태 */}
      <div className="flex items-center gap-2 p-4 bg-brand-cream rounded-lg">
        {hasToken ? (
          <>
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-brand-terra-cotta">Instagram 연동됨</span>
          </>
        ) : (
          <>
            <X className="w-5 h-5 text-red-600" />
            <span className="text-brand-warm-taupe">Instagram 연동 안됨</span>
          </>
        )}
      </div>

      {/* Instagram Access Token */}
      <div className="space-y-2">
        <Label htmlFor="instagram-token" className="text-brand-terra-cotta">
          Instagram Access Token
        </Label>
        <div className="space-y-2">
          <Input
            id="instagram-token"
            type="password"
            value={instagramToken}
            onChange={(e) => setInstagramToken(e.target.value)}
            placeholder="Instagram Access Token을 입력하세요"
            className="border-brand-warm-taupe/30"
          />
          <p className="text-xs text-brand-warm-taupe">
            Instagram Basic Display API의 Access Token을 입력하세요.{" "}
            <a
              href="https://developers.facebook.com/docs/instagram-basic-display-api/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-terra-cotta underline"
            >
              토큰 발급 방법 보기
            </a>
          </p>
        </div>
      </div>

      {/* Featured Image URL */}
      <div className="space-y-2">
        <Label htmlFor="featured-image" className="text-brand-terra-cotta">
          Featured Image URL (큰 이미지)
        </Label>
        <div className="space-y-2">
          <Input
            id="featured-image"
            value={featuredImageUrl}
            onChange={(e) => setFeaturedImageUrl(e.target.value)}
            placeholder="https://..."
            className="border-brand-warm-taupe/30"
          />
          <p className="text-xs text-brand-warm-taupe">
            Instagram Feed 섹션의 첫 번째 큰 이미지로 표시됩니다
          </p>
        </div>
        {currentFeaturedImage && (
          <div className="mt-2">
            <p className="text-xs text-brand-warm-taupe mb-2">현재 이미지:</p>
            <img
              src={currentFeaturedImage}
              alt="Featured"
              className="w-48 h-48 object-cover rounded"
            />
          </div>
        )}
      </div>

      {/* 저장 버튼들 */}
      <div className="flex gap-4">
        <Button
          onClick={handleSaveInstagramToken}
          disabled={loading || !instagramToken.trim()}
          className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
        >
          <Save className="w-4 h-4 mr-2" />
          Instagram 설정 저장
        </Button>
        <Button
          onClick={handleUpdateFeaturedImage}
          disabled={loading || !featuredImageUrl.trim()}
          variant="outline"
          className="border-brand-terra-cotta text-brand-terra-cotta hover:bg-brand-terra-cotta hover:text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Featured 이미지 업데이트
        </Button>
      </div>

      {/* 안내사항 */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-800 mb-2 font-medium">📌 설정 방법:</p>
        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
          <li>Facebook Developer에서 앱을 생성하고 Instagram Basic Display API를 활성화합니다</li>
          <li>Instagram 테스트 사용자를 추가하고 Access Token을 발급받습니다</li>
          <li>발급받은 Access Token을 위 입력란에 붙여넣고 저장합니다</li>
          <li>Featured Image URL에는 원하는 이미지 URL을 입력합니다</li>
          <li>저장 후 홈페이지의 Instagram Feed 섹션에서 최신 게시물 5개가 표시됩니다</li>
        </ol>
      </div>
    </div>
  );
}

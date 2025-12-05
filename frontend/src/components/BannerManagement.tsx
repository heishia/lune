import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "./ui/checkbox";
import { getBanners, createBanner, updateBanner, deleteBanner, type Banner as ApiBanner, type BannerContentBlock } from "../utils/api";

interface BannerContent {
  type: "text" | "image";
  content: string;
}

interface Banner {
  id: string;
  title: string;
  bannerImage: string;
  contentBlocks: BannerContent[];
  isActive: boolean;
  createdAt: string;
}

export function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    bannerImage: "",
    contentBlocks: [] as BannerContent[],
    isActive: true,
  });

  // 배너 데이터 로드
  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await getBanners();
      const mappedBanners: Banner[] = response.banners.map((b) => ({
        id: b.id,
        title: b.title,
        bannerImage: b.banner_image,
        contentBlocks: b.content_blocks as BannerContent[],
        isActive: b.is_active,
        createdAt: b.created_at.split("T")[0],
      }));
      setBanners(mappedBanners);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("배너 목록을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        bannerImage: banner.bannerImage,
        contentBlocks: banner.contentBlocks,
        isActive: banner.isActive,
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: "",
        bannerImage: "",
        contentBlocks: [],
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveBanner = async () => {
    if (!formData.title || !formData.bannerImage) {
      toast.error("제목과 배너 이미지는 필수입니다");
      return;
    }

    try {
      setSaving(true);
      const bannerData = {
        title: formData.title,
        banner_image: formData.bannerImage,
        content_blocks: formData.contentBlocks as BannerContentBlock[],
        is_active: formData.isActive,
      };

      if (editingBanner) {
        await updateBanner(editingBanner.id, bannerData);
        toast.success("배너가 수정되었습니다");
      } else {
        await createBanner(bannerData);
        toast.success("배너가 등록되었습니다");
      }

      setIsDialogOpen(false);
      fetchBanners();
    } catch (error) {
      console.error("Error saving banner:", error);
      toast.error("배너 저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("정말 이 배너를 삭제하시겠습니까?")) return;
    
    try {
      await deleteBanner(id);
      toast.success("배너가 삭제되었습니다");
      fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      toast.error("배너 삭제에 실패했습니다");
    }
  };

  const toggleBannerActive = async (id: string) => {
    const banner = banners.find((b) => b.id === id);
    if (!banner) return;

    try {
      await updateBanner(id, { is_active: !banner.isActive });
      toast.success("배너 상태가 변경되었습니다");
      fetchBanners();
    } catch (error) {
      console.error("Error toggling banner:", error);
      toast.error("배너 상태 변경에 실패했습니다");
    }
  };

  const addContentBlock = (type: "text" | "image") => {
    setFormData({
      ...formData,
      contentBlocks: [...formData.contentBlocks, { type, content: "" }],
    });
  };

  const updateContentBlock = (index: number, content: string) => {
    const newBlocks = [...formData.contentBlocks];
    newBlocks[index].content = content;
    setFormData({ ...formData, contentBlocks: newBlocks });
  };

  const removeContentBlock = (index: number) => {
    setFormData({
      ...formData,
      contentBlocks: formData.contentBlocks.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-brand-terra-cotta">배너 관리</h2>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
        >
          <Plus className="w-4 h-4 mr-2" />
          배너 추가
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-brand-warm-taupe">로딩 중...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 text-brand-warm-taupe">등록된 배너가 없습니다</div>
      ) : (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">미리보기</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="w-32">등록일</TableHead>
              <TableHead className="text-center w-24">상태</TableHead>
              <TableHead className="text-right w-32">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banners.map((banner) => (
              <TableRow key={banner.id}>
                <TableCell>
                  <img
                    src={banner.bannerImage}
                    alt={banner.title}
                    className="w-20 h-12 object-cover rounded"
                  />
                </TableCell>
                <TableCell>{banner.title}</TableCell>
                <TableCell className="text-sm text-brand-warm-taupe">
                  {banner.createdAt}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleBannerActive(banner.id)}
                    className={
                      banner.isActive
                        ? "text-green-600 hover:text-green-700"
                        : "text-brand-warm-taupe hover:text-brand-terra-cotta"
                    }
                  >
                    {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(banner)}
                      className="border-brand-warm-taupe/30 hover:bg-brand-warm-taupe/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      {/* 배너 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-brand-terra-cotta">
              {editingBanner ? "배너 수정" : "배너 추가"}
            </DialogTitle>
            <DialogDescription>
              배너 미리보기 이미지와 상세 콘텐츠를 설정하세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-brand-terra-cotta">
                제목 *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="배너 제목을 입력하세요"
                className="border-brand-warm-taupe/30"
              />
            </div>

            {/* 배너 이미지 */}
            <div className="space-y-2">
              <Label htmlFor="bannerImage" className="text-brand-terra-cotta">
                배너 미리보기 이미지 URL *
              </Label>
              <Input
                id="bannerImage"
                value={formData.bannerImage}
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                placeholder="https://..."
                className="border-brand-warm-taupe/30"
              />
              {formData.bannerImage && (
                <img
                  src={formData.bannerImage}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded mt-2"
                />
              )}
            </div>

            {/* 콘텐츠 블록 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-brand-terra-cotta">상세 페이지 콘텐츠</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addContentBlock("text")}
                    className="border-brand-warm-taupe/30 text-xs"
                  >
                    + 텍스트
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addContentBlock("image")}
                    className="border-brand-warm-taupe/30 text-xs"
                  >
                    + 이미지
                  </Button>
                </div>
              </div>

              {formData.contentBlocks.map((block, index) => (
                <div key={index} className="border border-brand-warm-taupe/30 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm text-brand-terra-cotta">
                      {block.type === "text" ? "📝 텍스트 블록" : "🖼️ 이미지 블록"}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeContentBlock(index)}
                      className="h-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {block.type === "text" ? (
                    <Textarea
                      value={block.content}
                      onChange={(e) => updateContentBlock(index, e.target.value)}
                      placeholder="텍스트 내용을 입력하세요"
                      className="border-brand-warm-taupe/30 min-h-20"
                    />
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={block.content}
                        onChange={(e) => updateContentBlock(index, e.target.value)}
                        placeholder="이미지 URL을 입력하세요"
                        className="border-brand-warm-taupe/30"
                      />
                      {block.content && (
                        <img
                          src={block.content}
                          alt={`Content ${index}`}
                          className="w-full h-48 object-cover rounded"
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}

              {formData.contentBlocks.length === 0 && (
                <div className="text-center py-8 text-brand-warm-taupe text-sm border border-dashed border-brand-warm-taupe/30 rounded-lg">
                  텍스트 또는 이미지 블록을 추가하여 상세 페이지를 구성하세요
                </div>
              )}
            </div>

            {/* 활성화 상태 */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: !!checked })
                }
              />
              <Label className="text-brand-terra-cotta cursor-pointer">배너 활성화</Label>
            </div>

            {/* 저장 버튼 */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-brand-warm-taupe/30"
                disabled={saving}
              >
                취소
              </Button>
              <Button
                onClick={handleSaveBanner}
                className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingBanner ? "수정" : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

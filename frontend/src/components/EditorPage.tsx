import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { 
  Image as ImageIcon, 
  Minus, 
  Quote, 
  Trash2,
  Video,
  Link,
  List,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X,
  GripVertical
} from "lucide-react";
import { 
  createContent, 
  updateContent, 
  getContent,
  uploadImage,
  uploadVideo,
  type Content, 
  type ContentBlock 
} from "../utils/api";

interface EditorPageProps {
  contentId?: string; // 수정 시 기존 콘텐츠 ID
  contentType: string; // "product", "banner", "post"
  referenceId?: string; // 연결된 상품/배너 ID
  initialTitle?: string;
  onSave?: (content: Content) => void;
  onBack: () => void;
}

// UUID 생성 함수
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function EditorPage({ 
  contentId, 
  contentType, 
  referenceId, 
  initialTitle = "",
  onSave, 
  onBack 
}: EditorPageProps) {
  const [title, setTitle] = useState(initialTitle);
  const [mainContent, setMainContent] = useState("");
  const [mediaBlocks, setMediaBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dragOverBlockId, setDragOverBlockId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // 기존 콘텐츠 로드
  useEffect(() => {
    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  // Textarea 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.max(textareaRef.current.scrollHeight, 400) + 'px';
    }
  }, [mainContent]);

  const loadContent = async () => {
    if (!contentId) return;
    try {
      setLoading(true);
      const content = await getContent(contentId);
      setTitle(content.title);
      
      // 블록들을 분리: 첫 번째 텍스트 블록은 mainContent로, 나머지는 mediaBlocks로
      const textBlock = content.blocks.find((b: ContentBlock) => b.type === "text");
      const otherBlocks = content.blocks.filter((b: ContentBlock) => b.type !== "text");
      
      if (textBlock) {
        setMainContent(textBlock.data.text || "");
      }
      setMediaBlocks(otherBlocks);
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("콘텐츠를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 미디어 블록 추가
  const addMediaBlock = (type: string, data?: Record<string, any>) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      data: data || getDefaultBlockData(type),
    };
    setMediaBlocks([...mediaBlocks, newBlock]);
  };

  // 이미지 파일 선택 핸들러
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      toast.info("이미지 업로드 중...");
      const result = await uploadImage(file);
      addMediaBlock("image", { url: result.url, caption: "" });
      toast.success("이미지가 추가되었습니다.");
    } catch (error: any) {
      toast.error(error.message || "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      // input 초기화
      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  // 동영상 파일 선택 핸들러
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      toast.info("동영상 업로드 중...");
      const result = await uploadVideo(file);
      addMediaBlock("video", { url: result.url, caption: "" });
      toast.success("동영상이 추가되었습니다.");
    } catch (error: any) {
      toast.error(error.message || "동영상 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      // input 초기화
      if (videoInputRef.current) {
        videoInputRef.current.value = "";
      }
    }
  };

  const getDefaultBlockData = (type: string): Record<string, any> => {
    switch (type) {
      case "image":
        return { url: "", caption: "" };
      case "video":
        return { url: "", caption: "" };
      case "divider":
        return {};
      case "quote":
        return { text: "", author: "" };
      case "link":
        return { url: "", title: "" };
      default:
        return {};
    }
  };

  // 미디어 블록 업데이트
  const updateMediaBlock = (blockId: string, data: Record<string, any>) => {
    setMediaBlocks(mediaBlocks.map((b) => (b.id === blockId ? { ...b, data: { ...b.data, ...data } } : b)));
  };

  // 미디어 블록 삭제
  const deleteMediaBlock = (blockId: string) => {
    setMediaBlocks(mediaBlocks.filter((b) => b.id !== blockId));
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", blockId);
    setDraggedBlockId(blockId);
  };

  const handleDragOver = (e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (blockId !== draggedBlockId) {
      setDragOverBlockId(blockId);
    }
  };

  const handleDragLeave = () => {
    setDragOverBlockId(null);
  };

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetBlockId) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }

    const draggedIndex = mediaBlocks.findIndex((b) => b.id === draggedBlockId);
    const targetIndex = mediaBlocks.findIndex((b) => b.id === targetBlockId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedBlockId(null);
      setDragOverBlockId(null);
      return;
    }

    const newBlocks = [...mediaBlocks];
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);
    setMediaBlocks(newBlocks);

    setDraggedBlockId(null);
    setDragOverBlockId(null);
  };

  const handleDragEnd = () => {
    setDraggedBlockId(null);
    setDragOverBlockId(null);
  };

  // 저장
  const handleSave = async (publish: boolean = false) => {
    try {
      setSaving(true);
      
      // 블록 배열 구성: 메인 텍스트 + 미디어 블록들
      const blocks: ContentBlock[] = [];
      
      if (mainContent.trim()) {
        blocks.push({
          id: generateId(),
          type: "text",
          data: { text: mainContent },
        });
      }
      
      blocks.push(...mediaBlocks);

      // 대표 이미지 찾기 (첫 번째 이미지 블록)
      const imageBlock = mediaBlocks.find((b) => b.type === "image" && b.data.url);
      const thumbnailUrl = imageBlock?.data.url;

      let content: Content;
      
      if (contentId) {
        content = await updateContent(contentId, {
          title,
          blocks,
          thumbnail_url: thumbnailUrl,
          is_published: publish,
        });
        toast.success("저장되었습니다");
      } else {
        content = await createContent({
          title,
          content_type: contentType,
          reference_id: referenceId,
          blocks,
          thumbnail_url: thumbnailUrl,
          is_published: publish,
        });
        toast.success("저장되었습니다");
      }

      if (onSave) {
        onSave(content);
      }
    } catch (error: any) {
      console.error("Error saving content:", error);
      toast.error(error.message || "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  // 미디어 블록 렌더링
  const renderMediaBlock = (block: ContentBlock, index: number) => {
    const isDragging = draggedBlockId === block.id;
    const isDragOver = dragOverBlockId === block.id;

    return (
      <div 
        key={block.id} 
        className={`group relative my-2 transition-all duration-200 ${
          isDragging ? "opacity-50" : ""
        } ${isDragOver ? "border-t-2 border-blue-400" : ""}`}
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={(e) => handleDragOver(e, block.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, block.id)}
        onDragEnd={handleDragEnd}
      >
        {/* 드래그 핸들 & 삭제 버튼 */}
        <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          <button
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => deleteMediaBlock(block.id)}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 블록 콘텐츠 */}
        {block.type === "image" && block.data.url && (
          <div className="space-y-2">
            <div className="relative group/img">
              <img 
                src={block.data.url} 
                alt={block.data.caption || "이미지"} 
                className="max-w-full rounded-lg select-none"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
              />
            </div>
            <Input
              value={block.data.caption || ""}
              onChange={(e) => updateMediaBlock(block.id, { caption: e.target.value })}
              placeholder="이미지 설명 (선택)"
              className="text-sm text-gray-500 border-0 text-center p-0 placeholder:text-gray-300 bg-transparent"
              style={{ boxShadow: 'none' }}
            />
          </div>
        )}

        {block.type === "video" && block.data.url && (
          <div className="space-y-2">
            <div className="relative group/vid">
              <video 
                src={block.data.url}
                controls
                className="max-w-full rounded-lg"
                draggable={false}
              />
            </div>
            <Input
              value={block.data.caption || ""}
              onChange={(e) => updateMediaBlock(block.id, { caption: e.target.value })}
              placeholder="동영상 설명 (선택)"
              className="text-sm text-gray-500 border-0 text-center p-0 placeholder:text-gray-300 bg-transparent"
              style={{ boxShadow: 'none' }}
            />
          </div>
        )}
        
        {block.type === "divider" && (
          <hr className="my-6 border-gray-300" />
        )}
        
        {block.type === "quote" && (
          <div className="border-l-4 border-brand-terra-cotta/50 pl-4 py-2 bg-brand-cream/30 rounded-r">
            <Textarea
              value={block.data.text || ""}
              onChange={(e) => updateMediaBlock(block.id, { text: e.target.value })}
              placeholder="인용구를 입력하세요..."
              className="w-full border-0 resize-none focus:ring-0 text-lg italic text-gray-600 min-h-[40px] p-0 placeholder:text-gray-300 bg-transparent"
              style={{ boxShadow: 'none' }}
            />
            <Input
              value={block.data.author || ""}
              onChange={(e) => updateMediaBlock(block.id, { author: e.target.value })}
              placeholder="- 출처"
              className="w-full border-0 focus:ring-0 text-sm text-gray-400 p-0 mt-2 placeholder:text-gray-300 bg-transparent"
              style={{ boxShadow: 'none' }}
            />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 상단 바 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="flex items-center justify-end px-4 py-2 gap-2">
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-[#03C75A] hover:bg-[#02b351] text-white px-6"
          >
            {saving ? "저장 중..." : "저장"}
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            className="border-gray-300 text-gray-600 hover:bg-gray-100 px-4"
          >
            <X className="w-4 h-4 mr-1" />
            나가기
          </Button>
        </div>
      </header>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/mov,video/avi"
        className="hidden"
        onChange={handleVideoSelect}
      />

      {/* 미디어 삽입 툴바 */}
      <div className="bg-white border-b border-gray-200 sticky top-[44px] z-40">
        <div className="flex items-center justify-center gap-1 px-4 py-2 overflow-x-auto">
          <ToolbarButton 
            icon={<ImageIcon className="w-5 h-5" />} 
            label={uploading ? "업로드중..." : "사진"} 
            onClick={() => imageInputRef.current?.click()} 
            disabled={uploading}
          />
          <ToolbarButton 
            icon={<Video className="w-5 h-5" />} 
            label={uploading ? "업로드중..." : "동영상"} 
            onClick={() => videoInputRef.current?.click()} 
            disabled={uploading}
          />
          <ToolbarButton icon={<Quote className="w-5 h-5" />} label="인용구" onClick={() => addMediaBlock("quote")} />
          <ToolbarButton icon={<Minus className="w-5 h-5" />} label="구분선" onClick={() => addMediaBlock("divider")} />
          <ToolbarButton icon={<Link className="w-5 h-5" />} label="링크" onClick={() => addMediaBlock("link")} />
        </div>
      </div>

      {/* 텍스트 서식 툴바 */}
      <div className="bg-white border-b border-gray-200 sticky top-[96px] z-30">
        <div className="flex items-center justify-center gap-1 px-4 py-1.5 overflow-x-auto">
          <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700">
            <option>본문</option>
            <option>제목 1</option>
            <option>제목 2</option>
            <option>제목 3</option>
          </select>
          <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 ml-2">
            <option>나눔고딕</option>
            <option>맑은 고딕</option>
            <option>돋움</option>
          </select>
          <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 ml-2 w-16">
            <option>15</option>
            <option>13</option>
            <option>16</option>
            <option>18</option>
            <option>20</option>
            <option>24</option>
          </select>
          
          <div className="w-px h-5 bg-gray-300 mx-2" />
          
          <FormatButton icon={<Bold className="w-4 h-4" />} title="굵게" />
          <FormatButton icon={<Italic className="w-4 h-4" />} title="기울임" />
          <FormatButton icon={<Underline className="w-4 h-4" />} title="밑줄" />
          <FormatButton icon={<Strikethrough className="w-4 h-4" />} title="취소선" />
          
          <div className="w-px h-5 bg-gray-300 mx-2" />
          
          <FormatButton icon={<AlignLeft className="w-4 h-4" />} title="왼쪽 정렬" />
          <FormatButton icon={<AlignCenter className="w-4 h-4" />} title="가운데 정렬" />
          <FormatButton icon={<AlignRight className="w-4 h-4" />} title="오른쪽 정렬" />
          <FormatButton icon={<List className="w-4 h-4" />} title="목록" />
        </div>
      </div>

      {/* 에디터 영역 */}
      <main className="flex-1 bg-white">
        {/* 메인 편집 영역 */}
        <div className="max-w-4xl mx-auto bg-white min-h-[calc(100vh-148px)] px-8 md:px-12 lg:px-16 py-10 shadow-sm">
          {/* 메인 텍스트 입력 영역 */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={mainContent}
              onChange={(e) => setMainContent(e.target.value)}
              placeholder="상품에 대해 적어보세요!"
              className="w-full min-h-[400px] border-0 resize-none focus:ring-0 focus:outline-none text-base leading-relaxed p-0 placeholder:text-gray-300 bg-transparent"
            />
          </div>

          {/* 미디어 블록 영역 */}
          {mediaBlocks.length > 0 && (
            <div className="mt-4">
              {mediaBlocks.map((block, index) => renderMediaBlock(block, index))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// 툴바 버튼 컴포넌트
function ToolbarButton({ 
  icon, 
  label, 
  onClick,
  disabled = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded transition-colors ${
        disabled 
          ? "text-gray-400 cursor-not-allowed" 
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {icon}
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

// 서식 버튼 컴포넌트
function FormatButton({ 
  icon, 
  title,
  active = false
}: { 
  icon: React.ReactNode; 
  title: string;
  active?: boolean;
}) {
  return (
    <button
      title={title}
      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
        active ? 'bg-gray-200 text-gray-800' : 'text-gray-600'
      }`}
    >
      {icon}
    </button>
  );
}

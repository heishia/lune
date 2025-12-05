import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Plus, 
  Type, 
  Image as ImageIcon, 
  Minus, 
  Quote, 
  Heading1, 
  Heading2,
  Trash2,
  GripVertical,
  Save,
  Video,
  Link,
  Table,
  List,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  X
} from "lucide-react";
import { 
  createContent, 
  updateContent, 
  getContent,
  type Content, 
  type ContentBlock 
} from "../utils/api";
import logo from "figma:asset/e95f335bacb8348ed117f587f5d360e078bf26b6.png";

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
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  
  const blockMenuRef = useRef<HTMLDivElement>(null);

  // 기존 콘텐츠 로드
  useEffect(() => {
    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  // 블록 메뉴 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (blockMenuRef.current && !blockMenuRef.current.contains(event.target as Node)) {
        setShowBlockMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadContent = async () => {
    if (!contentId) return;
    try {
      setLoading(true);
      const content = await getContent(contentId);
      setTitle(content.title);
      setBlocks(content.blocks);
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("콘텐츠를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 블록 추가
  const addBlock = (type: string, afterBlockId?: string) => {
    const newBlock: ContentBlock = {
      id: generateId(),
      type,
      data: getDefaultBlockData(type),
    };

    if (afterBlockId) {
      const index = blocks.findIndex((b) => b.id === afterBlockId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      setBlocks(newBlocks);
    } else {
      setBlocks([...blocks, newBlock]);
    }

    setShowBlockMenu(null);
    setFocusedBlockId(newBlock.id);
  };

  const getDefaultBlockData = (type: string): Record<string, any> => {
    switch (type) {
      case "text":
        return { text: "" };
      case "heading1":
        return { text: "" };
      case "heading2":
        return { text: "" };
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

  // 블록 업데이트
  const updateBlock = (blockId: string, data: Record<string, any>) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, data: { ...b.data, ...data } } : b)));
  };

  // 블록 삭제
  const deleteBlock = (blockId: string) => {
    setBlocks(blocks.filter((b) => b.id !== blockId));
  };

  // 저장
  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }

    try {
      setSaving(true);
      
      // 대표 이미지 찾기 (첫 번째 이미지 블록)
      const imageBlock = blocks.find((b) => b.type === "image" && b.data.url);
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

  // 블록 렌더링
  const renderBlock = (block: ContentBlock, index: number) => {
    return (
      <div 
        key={block.id} 
        className="group relative"
        onFocus={() => setFocusedBlockId(block.id)}
      >
        {/* 블록 추가 버튼 (왼쪽) */}
        <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* 블록 삭제 버튼 (오른쪽) */}
        <div className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => deleteBlock(block.id)}
            className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* 블록 메뉴 팝업 */}
        {showBlockMenu === block.id && (
          <div 
            ref={blockMenuRef}
            className="absolute -left-10 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 w-40"
          >
            <BlockMenuItem icon={<Type className="w-4 h-4" />} label="텍스트" onClick={() => addBlock("text", block.id)} />
            <BlockMenuItem icon={<Heading1 className="w-4 h-4" />} label="제목 1" onClick={() => addBlock("heading1", block.id)} />
            <BlockMenuItem icon={<Heading2 className="w-4 h-4" />} label="제목 2" onClick={() => addBlock("heading2", block.id)} />
            <BlockMenuItem icon={<ImageIcon className="w-4 h-4" />} label="이미지" onClick={() => addBlock("image", block.id)} />
            <BlockMenuItem icon={<Minus className="w-4 h-4" />} label="구분선" onClick={() => addBlock("divider", block.id)} />
            <BlockMenuItem icon={<Quote className="w-4 h-4" />} label="인용구" onClick={() => addBlock("quote", block.id)} />
          </div>
        )}

        {/* 블록 콘텐츠 */}
        <div className="py-1">
          {block.type === "text" && (
            <Textarea
              value={block.data.text || ""}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              placeholder="내용을 입력하세요..."
              className="w-full border-0 resize-none focus:ring-0 text-base leading-relaxed min-h-[60px] p-0 placeholder:text-gray-300 bg-transparent"
              style={{ boxShadow: 'none' }}
            />
          )}
          
          {block.type === "heading1" && (
            <Input
              value={block.data.text || ""}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              placeholder="제목을 입력하세요"
              className="w-full border-0 focus:ring-0 text-2xl font-bold p-0 placeholder:text-gray-300 bg-transparent"
              style={{ boxShadow: 'none' }}
            />
          )}
          
          {block.type === "heading2" && (
            <Input
              value={block.data.text || ""}
              onChange={(e) => updateBlock(block.id, { text: e.target.value })}
              placeholder="소제목을 입력하세요"
              className="w-full border-0 focus:ring-0 text-xl font-semibold p-0 placeholder:text-gray-300 bg-transparent"
              style={{ boxShadow: 'none' }}
            />
          )}
          
          {block.type === "image" && (
            <div className="space-y-2">
              {block.data.url ? (
                <div className="relative group/img">
                  <img 
                    src={block.data.url} 
                    alt={block.data.caption || "이미지"} 
                    className="max-w-full rounded-lg"
                  />
                  <button
                    onClick={() => updateBlock(block.id, { url: "", caption: "" })}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white opacity-0 group-hover/img:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                  <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <Input
                    value={block.data.url || ""}
                    onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                    placeholder="이미지 URL을 입력하세요"
                    className="max-w-md mx-auto"
                  />
                </div>
              )}
              {block.data.url && (
                <Input
                  value={block.data.caption || ""}
                  onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
                  placeholder="이미지 설명 (선택)"
                  className="text-sm text-gray-500 border-0 text-center p-0 placeholder:text-gray-300 bg-transparent"
                  style={{ boxShadow: 'none' }}
                />
              )}
            </div>
          )}

          {block.type === "video" && (
            <div className="space-y-2">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50">
                <Video className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <Input
                  value={block.data.url || ""}
                  onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                  placeholder="동영상 URL을 입력하세요 (YouTube, Vimeo 등)"
                  className="max-w-md mx-auto"
                />
              </div>
            </div>
          )}
          
          {block.type === "divider" && (
            <hr className="my-6 border-gray-300" />
          )}
          
          {block.type === "quote" && (
            <div className="border-l-4 border-brand-terra-cotta/50 pl-4 py-2 bg-brand-cream/30 rounded-r">
              <Textarea
                value={block.data.text || ""}
                onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                placeholder="인용구를 입력하세요..."
                className="w-full border-0 resize-none focus:ring-0 text-lg italic text-gray-600 min-h-[40px] p-0 placeholder:text-gray-300 bg-transparent"
                style={{ boxShadow: 'none' }}
              />
              <Input
                value={block.data.author || ""}
                onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                placeholder="- 출처"
                className="w-full border-0 focus:ring-0 text-sm text-gray-400 p-0 mt-2 placeholder:text-gray-300 bg-transparent"
                style={{ boxShadow: 'none' }}
              />
            </div>
          )}
        </div>
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

      {/* 미디어 삽입 툴바 */}
      <div className="bg-white border-b border-gray-200 sticky top-[44px] z-40">
        <div className="flex items-center justify-center gap-1 px-4 py-2 overflow-x-auto">
          <ToolbarButton icon={<ImageIcon className="w-5 h-5" />} label="사진" onClick={() => addBlock("image")} />
          <ToolbarButton icon={<Video className="w-5 h-5" />} label="동영상" onClick={() => addBlock("video")} />
          <ToolbarButton icon={<Quote className="w-5 h-5" />} label="인용구" onClick={() => addBlock("quote")} />
          <ToolbarButton icon={<Minus className="w-5 h-5" />} label="구분선" onClick={() => addBlock("divider")} />
          <ToolbarButton icon={<Link className="w-5 h-5" />} label="링크" onClick={() => addBlock("link")} />
        </div>
      </div>

      {/* 텍스트 서식 툴바 */}
      <div className="bg-[#f8f8f8] border-b border-gray-200 sticky top-[96px] z-30">
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
      <main className="flex-1 bg-[#f5f5f5]">
        {/* 메인 편집 영역 */}
        <div className="max-w-4xl mx-auto bg-white min-h-full px-8 md:px-12 lg:px-16 py-10 shadow-sm">
          {/* 제목 입력 */}
          <div className="mb-8">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목"
              className="text-3xl font-bold border-0 focus:ring-0 p-0 placeholder:text-gray-300 bg-transparent"
              style={{ boxShadow: 'none' }}
            />
            <div className="h-px bg-gray-200 mt-4" />
          </div>

          {/* 블록 영역 */}
          <div className="space-y-2 pl-10">
            {blocks.length === 0 ? (
              <div className="relative group">
                <div className="absolute -left-10 top-2">
                  <button
                    onClick={() => setShowBlockMenu("empty")}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {showBlockMenu === "empty" && (
                  <div 
                    ref={blockMenuRef}
                    className="absolute -left-10 top-8 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 w-40"
                  >
                    <BlockMenuItem icon={<Type className="w-4 h-4" />} label="텍스트" onClick={() => { addBlock("text"); setShowBlockMenu(null); }} />
                    <BlockMenuItem icon={<Heading1 className="w-4 h-4" />} label="제목 1" onClick={() => { addBlock("heading1"); setShowBlockMenu(null); }} />
                    <BlockMenuItem icon={<Heading2 className="w-4 h-4" />} label="제목 2" onClick={() => { addBlock("heading2"); setShowBlockMenu(null); }} />
                    <BlockMenuItem icon={<ImageIcon className="w-4 h-4" />} label="이미지" onClick={() => { addBlock("image"); setShowBlockMenu(null); }} />
                    <BlockMenuItem icon={<Minus className="w-4 h-4" />} label="구분선" onClick={() => { addBlock("divider"); setShowBlockMenu(null); }} />
                    <BlockMenuItem icon={<Quote className="w-4 h-4" />} label="인용구" onClick={() => { addBlock("quote"); setShowBlockMenu(null); }} />
                  </div>
                )}
                
                <p className="text-gray-300 py-4 text-base">
                  상품에 대해 적어보세요!
                </p>
              </div>
            ) : (
              blocks.map((block, index) => renderBlock(block, index))
            )}

            {/* 마지막 블록 추가 버튼 */}
            {blocks.length > 0 && (
              <div className="relative group pt-4">
                <div className="absolute -left-10 top-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setShowBlockMenu("last")}
                    className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {showBlockMenu === "last" && (
                  <div 
                    ref={blockMenuRef}
                    className="absolute -left-10 top-12 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 w-40"
                  >
                    <BlockMenuItem icon={<Type className="w-4 h-4" />} label="텍스트" onClick={() => { addBlock("text"); setShowBlockMenu(null); }} />
                    <BlockMenuItem icon={<Heading1 className="w-4 h-4" />} label="제목 1" onClick={() => { addBlock("heading1"); setShowBlockMenu(null); }} />
                    <BlockMenuItem icon={<Heading2 className="w-4 h-4" />} label="제목 2" onClick={() => { addBlock("heading2"); setShowBlockMenu(null); }} />
                    <BlockMenuItem icon={<ImageIcon className="w-4 h-4" />} label="이미지" onClick={() => { addBlock("image"); setShowBlockMenu(null); }} />
                    <BlockMenuItem icon={<Minus className="w-4 h-4" />} label="구분선" onClick={() => { addBlock("divider"); setShowBlockMenu(null); }} />
                    <BlockMenuItem icon={<Quote className="w-4 h-4" />} label="인용구" onClick={() => { addBlock("quote"); setShowBlockMenu(null); }} />
                  </div>
                )}
                
                <div className="h-40" />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// 툴바 버튼 컴포넌트
function ToolbarButton({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 px-3 py-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800 transition-colors"
    >
      {icon}
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

// 툴바 구분선
function ToolbarDivider() {
  return <div className="w-px h-10 bg-gray-200 mx-1" />;
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

// 블록 메뉴 아이템 컴포넌트
function BlockMenuItem({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 text-gray-700"
    >
      <span className="text-gray-400">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

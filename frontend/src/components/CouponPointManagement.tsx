import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Search, Gift, Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { 
  searchUsers, 
  issuePoints, 
  getPointHistory,
  getCoupons,
  createCoupon,
  issueCouponToUser,
  type AdminUser,
  type PointHistory as ApiPointHistory,
  type Coupon as ApiCoupon,
} from "../utils/api";

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
}

interface CouponHistory {
  id: string;
  couponId: string;
  couponName: string;
  userId: string;
  userName: string;
  issuedDate: string;
}

interface PointHistoryItem {
  id: string;
  userId: string;
  userName: string;
  points: number;
  reason: string;
  issuedDate: string;
}

export function CouponPointManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCouponDialogOpen, setIsCouponDialogOpen] = useState(false);
  const [isPointDialogOpen, setIsPointDialogOpen] = useState(false);
  const [isNewCouponDialogOpen, setIsNewCouponDialogOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // 쿠폰 목록
  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string>("");

  // 포인트 지급 내역
  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>([]);

  // 새 쿠폰 생성 폼 데이터
  const [newCouponFormData, setNewCouponFormData] = useState({
    code: "",
    name: "",
    discountType: "percentage" as "percentage" | "fixed_amount",
    discountValue: 0,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: "",
  });

  // 포인트 폼 데이터
  const [pointFormData, setPointFormData] = useState({
    points: 0,
    reason: "",
  });

  // 쿠폰 목록 로드
  const fetchCoupons = async () => {
    try {
      const response = await getCoupons();
      setCoupons(response.coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    }
  };

  // 포인트 내역 로드
  const fetchPointHistory = async () => {
    try {
      const response = await getPointHistory();
      // 실제로는 userName도 가져와야 하지만 현재 API에서는 user_id만 반환
      const history: PointHistoryItem[] = response.history.map((h) => ({
        id: h.id,
        userId: h.user_id,
        userName: h.user_id.substring(0, 8) + "...", // 임시로 ID 일부 표시
        points: h.points,
        reason: h.reason,
        issuedDate: h.created_at.split("T")[0],
      }));
      setPointHistory(history);
    } catch (error) {
      console.error("Error fetching point history:", error);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchPointHistory();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("검색어를 입력하세요");
      return;
    }

    try {
      setSearching(true);
      const response = await searchUsers(searchQuery);
      const results: User[] = response.users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        points: u.points,
      }));
      setSearchResults(results);

      if (results.length === 0) {
        toast.error("검색 결과가 없습니다");
      }
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("사용자 검색에 실패했습니다");
    } finally {
      setSearching(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!newCouponFormData.code || !newCouponFormData.name || !newCouponFormData.validUntil || newCouponFormData.discountValue <= 0) {
      toast.error("모든 정보를 입력해주세요");
      return;
    }

    try {
      setSaving(true);
      await createCoupon({
        code: newCouponFormData.code,
        name: newCouponFormData.name,
        discount_type: newCouponFormData.discountType,
        discount_value: newCouponFormData.discountValue,
        valid_from: new Date(newCouponFormData.validFrom).toISOString(),
        valid_until: new Date(newCouponFormData.validUntil).toISOString(),
      });
      toast.success("쿠폰이 생성되었습니다");
      setIsNewCouponDialogOpen(false);
      setNewCouponFormData({
        code: "",
        name: "",
        discountType: "percentage",
        discountValue: 0,
        validFrom: new Date().toISOString().split("T")[0],
        validUntil: "",
      });
      fetchCoupons();
    } catch (error: any) {
      console.error("Error creating coupon:", error);
      toast.error(error.message || "쿠폰 생성에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleIssueCoupon = async () => {
    if (!selectedUser || !selectedCouponId) {
      toast.error("쿠폰을 선택해주세요");
      return;
    }

    try {
      setSaving(true);
      await issueCouponToUser(selectedCouponId, selectedUser.id);
      toast.success(`${selectedUser.name}님에게 쿠폰이 발행되었습니다`);
      setIsCouponDialogOpen(false);
      setSelectedCouponId("");
    } catch (error: any) {
      console.error("Error issuing coupon:", error);
      toast.error(error.message || "쿠폰 발행에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleIssuePoints = async () => {
    if (!selectedUser) return;

    if (pointFormData.points <= 0 || !pointFormData.reason) {
      toast.error("포인트와 사유를 입력해주세요");
      return;
    }

    try {
      setSaving(true);
      await issuePoints(selectedUser.id, {
        points: pointFormData.points,
        reason: pointFormData.reason,
      });
      toast.success(`${selectedUser.name}님에게 ${pointFormData.points}P가 지급되었습니다`);
      setIsPointDialogOpen(false);
      setPointFormData({
        points: 0,
        reason: "",
      });
      fetchPointHistory();
      // 사용자 목록도 새로고침
      if (searchQuery) {
        handleSearch();
      }
    } catch (error: any) {
      console.error("Error issuing points:", error);
      toast.error(error.message || "포인트 지급에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-brand-terra-cotta">쿠폰 & 포인트 관리</h2>

      {/* 사용자 검색 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-brand-terra-cotta">사용자 검색</h3>
          <Button
            onClick={() => setIsNewCouponDialogOpen(true)}
            variant="outline"
            className="border-brand-terra-cotta text-brand-terra-cotta hover:bg-brand-terra-cotta hover:text-white"
          >
            <Gift className="w-4 h-4 mr-2" />
            새 쿠폰 만들기
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="이름, ID, 이메일로 검색"
            className="border-brand-warm-taupe/30"
          />
          <Button
            onClick={handleSearch}
            disabled={searching}
            className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
          >
            {searching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            검색
          </Button>
        </div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="border border-brand-warm-taupe/30 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead className="text-right">포인트</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id.substring(0, 8)}...</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-sm text-brand-warm-taupe">{user.email}</TableCell>
                    <TableCell className="text-right text-brand-terra-cotta">
                      {user.points.toLocaleString()}P
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsCouponDialogOpen(true);
                          }}
                          className="border-brand-warm-taupe/30 hover:bg-brand-warm-taupe/10 text-xs"
                        >
                          <Gift className="w-3 h-3 mr-1" />
                          쿠폰
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsPointDialogOpen(true);
                          }}
                          className="border-brand-warm-taupe/30 hover:bg-brand-warm-taupe/10 text-xs"
                        >
                          <Coins className="w-3 h-3 mr-1" />
                          포인트
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 발행 내역 */}
      <Tabs defaultValue="coupons" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="coupons">쿠폰 목록</TabsTrigger>
          <TabsTrigger value="points">포인트 지급 내역</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="mt-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {coupons.length === 0 ? (
              <div className="text-center py-12 text-brand-warm-taupe">
                생성된 쿠폰이 없습니다
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>쿠폰 코드</TableHead>
                  <TableHead>쿠폰명</TableHead>
                  <TableHead>할인</TableHead>
                  <TableHead>유효기간</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono text-xs">{coupon.code}</TableCell>
                    <TableCell>{coupon.name}</TableCell>
                    <TableCell className="text-brand-terra-cotta">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}%` 
                        : `${coupon.discount_value.toLocaleString()}원`}
                    </TableCell>
                    <TableCell className="text-sm text-brand-warm-taupe">
                      {coupon.valid_from.split("T")[0]} ~ {coupon.valid_until.split("T")[0]}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded text-xs ${coupon.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {coupon.is_active ? '활성' : '비활성'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="points" className="mt-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {pointHistory.length === 0 ? (
              <div className="text-center py-12 text-brand-warm-taupe">
                포인트 지급 내역이 없습니다
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자 ID</TableHead>
                  <TableHead className="text-right">포인트</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>지급일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pointHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs">{record.userId.substring(0, 8)}...</TableCell>
                    <TableCell className="text-right text-brand-terra-cotta">
                      {record.points > 0 ? '+' : ''}{record.points.toLocaleString()}P
                    </TableCell>
                    <TableCell className="text-sm">{record.reason}</TableCell>
                    <TableCell className="text-sm text-brand-warm-taupe">
                      {record.issuedDate}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 쿠폰 발행 다이얼로그 */}
      <Dialog open={isCouponDialogOpen} onOpenChange={setIsCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-brand-terra-cotta">쿠폰 발행</DialogTitle>
            <DialogDescription>
              {selectedUser?.name}님에게 쿠폰을 발행합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-brand-terra-cotta">발행할 쿠폰 선택 *</Label>
              {coupons.length === 0 ? (
                <div className="text-sm text-brand-warm-taupe p-4 border border-dashed border-brand-warm-taupe/30 rounded text-center">
                  발행 가능한 쿠폰이 없습니다. 먼저 쿠폰을 생성해주세요.
                </div>
              ) : (
                <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                  <SelectTrigger className="border-brand-warm-taupe/30">
                    <SelectValue placeholder="쿠폰을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {coupons.filter(c => c.is_active).map((coupon) => (
                      <SelectItem key={coupon.id} value={coupon.id}>
                        {coupon.name} ({coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value.toLocaleString()}원`})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCouponDialogOpen(false)}
                className="border-brand-warm-taupe/30"
                disabled={saving}
              >
                취소
              </Button>
              <Button
                onClick={handleIssueCoupon}
                disabled={saving || !selectedCouponId}
                className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                발행
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 새 쿠폰 생성 다이얼로그 */}
      <Dialog open={isNewCouponDialogOpen} onOpenChange={setIsNewCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-brand-terra-cotta">새 쿠폰 생성</DialogTitle>
            <DialogDescription>
              새로운 쿠폰을 생성합니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="couponCode" className="text-brand-terra-cotta">
                  쿠폰 코드 *
                </Label>
                <Input
                  id="couponCode"
                  value={newCouponFormData.code}
                  onChange={(e) =>
                    setNewCouponFormData({ ...newCouponFormData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="예: WELCOME5000"
                  className="border-brand-warm-taupe/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newCouponName" className="text-brand-terra-cotta">
                  쿠폰명 *
                </Label>
                <Input
                  id="newCouponName"
                  value={newCouponFormData.name}
                  onChange={(e) =>
                    setNewCouponFormData({ ...newCouponFormData, name: e.target.value })
                  }
                  placeholder="예: 신규가입 5,000원 할인"
                  className="border-brand-warm-taupe/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-terra-cotta">할인 유형 *</Label>
                <Select
                  value={newCouponFormData.discountType}
                  onValueChange={(value: "percentage" | "fixed_amount") =>
                    setNewCouponFormData({ ...newCouponFormData, discountType: value })
                  }
                >
                  <SelectTrigger className="border-brand-warm-taupe/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">퍼센트 (%)</SelectItem>
                    <SelectItem value="fixed_amount">정액 (원)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newDiscountValue" className="text-brand-terra-cotta">
                  할인 값 *
                </Label>
                <Input
                  id="newDiscountValue"
                  type="number"
                  value={newCouponFormData.discountValue}
                  onChange={(e) =>
                    setNewCouponFormData({
                      ...newCouponFormData,
                      discountValue: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="border-brand-warm-taupe/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom" className="text-brand-terra-cotta">
                  시작일 *
                </Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={newCouponFormData.validFrom}
                  onChange={(e) =>
                    setNewCouponFormData({ ...newCouponFormData, validFrom: e.target.value })
                  }
                  className="border-brand-warm-taupe/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil" className="text-brand-terra-cotta">
                  만료일 *
                </Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={newCouponFormData.validUntil}
                  onChange={(e) =>
                    setNewCouponFormData({ ...newCouponFormData, validUntil: e.target.value })
                  }
                  className="border-brand-warm-taupe/30"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsNewCouponDialogOpen(false)}
                className="border-brand-warm-taupe/30"
                disabled={saving}
              >
                취소
              </Button>
              <Button
                onClick={handleCreateCoupon}
                disabled={saving}
                className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                생성
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 포인트 지급 다이얼로그 */}
      <Dialog open={isPointDialogOpen} onOpenChange={setIsPointDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-brand-terra-cotta">포인트 지급</DialogTitle>
            <DialogDescription>
              {selectedUser?.name}님에게 포인트를 지급합니다 (현재 보유: {selectedUser?.points.toLocaleString()}P)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="points" className="text-brand-terra-cotta">
                지급 포인트 *
              </Label>
              <Input
                id="points"
                type="number"
                value={pointFormData.points}
                onChange={(e) =>
                  setPointFormData({ ...pointFormData, points: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
                className="border-brand-warm-taupe/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-brand-terra-cotta">
                지급 사유 *
              </Label>
              <Input
                id="reason"
                value={pointFormData.reason}
                onChange={(e) =>
                  setPointFormData({ ...pointFormData, reason: e.target.value })
                }
                placeholder="예: 리뷰 작성, 이벤트 참여"
                className="border-brand-warm-taupe/30"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsPointDialogOpen(false)}
                className="border-brand-warm-taupe/30"
                disabled={saving}
              >
                취소
              </Button>
              <Button
                onClick={handleIssuePoints}
                disabled={saving}
                className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                지급
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

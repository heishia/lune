import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Search, Gift, Coins } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  coupons: Coupon[];
}

interface Coupon {
  id: string;
  code: string;
  name: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  expiryDate: string;
  isUsed: boolean;
}

interface CouponHistory {
  id: string;
  userId: string;
  userName: string;
  couponName: string;
  issuedDate: string;
}

interface PointHistory {
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

  // 쿠폰 발행 내역
  const [couponHistory, setCouponHistory] = useState<CouponHistory[]>([
    {
      id: "1",
      userId: "user1",
      userName: "김루네",
      couponName: "신규가입 5,000원 할인",
      issuedDate: "2024-11-15",
    },
    {
      id: "2",
      userId: "user2",
      userName: "박루네",
      couponName: "블랙프라이데이 10% 할인",
      issuedDate: "2024-11-18",
    },
  ]);

  // 포인트 지급 내역
  const [pointHistory, setPointHistory] = useState<PointHistory[]>([
    {
      id: "1",
      userId: "user1",
      userName: "김루네",
      points: 1000,
      reason: "리뷰 작성",
      issuedDate: "2024-11-16",
    },
    {
      id: "2",
      userId: "user2",
      userName: "박루네",
      points: 500,
      reason: "이벤트 참여",
      issuedDate: "2024-11-17",
    },
  ]);

  // 쿠폰 폼 데이터
  const [couponFormData, setCouponFormData] = useState({
    name: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: 0,
    expiryDate: "",
  });

  // 포인트 폼 데이터
  const [pointFormData, setPointFormData] = useState({
    points: 0,
    reason: "",
  });

  // 임시 사용자 데이터
  const mockUsers: User[] = [
    {
      id: "user1",
      name: "김루네",
      email: "lune1@example.com",
      points: 2500,
      coupons: [
        {
          id: "c1",
          code: "WELCOME5000",
          name: "신규가입 5,000원 할인",
          discountType: "fixed",
          discountValue: 5000,
          expiryDate: "2024-12-31",
          isUsed: false,
        },
      ],
    },
    {
      id: "user2",
      name: "박루네",
      email: "lune2@example.com",
      points: 1500,
      coupons: [],
    },
    {
      id: "user3",
      name: "이루네",
      email: "lune3@example.com",
      points: 3000,
      coupons: [],
    },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("검색어를 입력하세요");
      return;
    }

    const results = mockUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setSearchResults(results);

    if (results.length === 0) {
      toast.error("검색 결과가 없습니다");
    }
  };

  const handleIssueCoupon = () => {
    if (!selectedUser) return;

    if (!couponFormData.name || !couponFormData.expiryDate || couponFormData.discountValue <= 0) {
      toast.error("모든 정보를 입력해주세요");
      return;
    }

    const newHistory: CouponHistory = {
      id: Date.now().toString(),
      userId: selectedUser.id,
      userName: selectedUser.name,
      couponName: couponFormData.name,
      issuedDate: new Date().toISOString().split("T")[0],
    };

    setCouponHistory([newHistory, ...couponHistory]);
    toast.success(`${selectedUser.name}님에게 쿠폰이 발행되었습니다`);

    setIsCouponDialogOpen(false);
    setCouponFormData({
      name: "",
      discountType: "percent",
      discountValue: 0,
      expiryDate: "",
    });
  };

  const handleIssuePoints = () => {
    if (!selectedUser) return;

    if (pointFormData.points <= 0 || !pointFormData.reason) {
      toast.error("포인트와 사유를 입력해주세요");
      return;
    }

    const newHistory: PointHistory = {
      id: Date.now().toString(),
      userId: selectedUser.id,
      userName: selectedUser.name,
      points: pointFormData.points,
      reason: pointFormData.reason,
      issuedDate: new Date().toISOString().split("T")[0],
    };

    setPointHistory([newHistory, ...pointHistory]);
    toast.success(`${selectedUser.name}님에게 ${pointFormData.points}P가 지급되었습니다`);

    setIsPointDialogOpen(false);
    setPointFormData({
      points: 0,
      reason: "",
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-brand-terra-cotta">쿠폰 & 포인트 관리</h2>

      {/* 사용자 검색 */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-brand-terra-cotta">사용자 검색</h3>
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
            className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
          >
            <Search className="w-4 h-4 mr-2" />
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
                  <TableHead className="text-center">쿠폰 수</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-sm text-brand-warm-taupe">{user.email}</TableCell>
                    <TableCell className="text-right text-brand-terra-cotta">
                      {user.points.toLocaleString()}P
                    </TableCell>
                    <TableCell className="text-center">{user.coupons.length}개</TableCell>
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
          <TabsTrigger value="coupons">쿠폰 발행 내역</TabsTrigger>
          <TabsTrigger value="points">포인트 지급 내역</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="mt-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자 ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>쿠폰명</TableHead>
                  <TableHead>발행일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {couponHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs">{record.userId}</TableCell>
                    <TableCell>{record.userName}</TableCell>
                    <TableCell className="text-brand-terra-cotta">{record.couponName}</TableCell>
                    <TableCell className="text-sm text-brand-warm-taupe">
                      {record.issuedDate}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="points" className="mt-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자 ID</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead className="text-right">포인트</TableHead>
                  <TableHead>사유</TableHead>
                  <TableHead>발행일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pointHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs">{record.userId}</TableCell>
                    <TableCell>{record.userName}</TableCell>
                    <TableCell className="text-right text-brand-terra-cotta">
                      +{record.points.toLocaleString()}P
                    </TableCell>
                    <TableCell className="text-sm">{record.reason}</TableCell>
                    <TableCell className="text-sm text-brand-warm-taupe">
                      {record.issuedDate}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              <Label htmlFor="couponName" className="text-brand-terra-cotta">
                쿠폰명 *
              </Label>
              <Input
                id="couponName"
                value={couponFormData.name}
                onChange={(e) =>
                  setCouponFormData({ ...couponFormData, name: e.target.value })
                }
                placeholder="예: 신규가입 5,000원 할인"
                className="border-brand-warm-taupe/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-brand-terra-cotta">할인 유형 *</Label>
                <Select
                  value={couponFormData.discountType}
                  onValueChange={(value: "percent" | "fixed") =>
                    setCouponFormData({ ...couponFormData, discountType: value })
                  }
                >
                  <SelectTrigger className="border-brand-warm-taupe/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">퍼센트 (%)</SelectItem>
                    <SelectItem value="fixed">정액 (원)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue" className="text-brand-terra-cotta">
                  할인 값 *
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={couponFormData.discountValue}
                  onChange={(e) =>
                    setCouponFormData({
                      ...couponFormData,
                      discountValue: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="border-brand-warm-taupe/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate" className="text-brand-terra-cotta">
                만료일 *
              </Label>
              <Input
                id="expiryDate"
                type="date"
                value={couponFormData.expiryDate}
                onChange={(e) =>
                  setCouponFormData({ ...couponFormData, expiryDate: e.target.value })
                }
                className="border-brand-warm-taupe/30"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCouponDialogOpen(false)}
                className="border-brand-warm-taupe/30"
              >
                취소
              </Button>
              <Button
                onClick={handleIssueCoupon}
                className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
              >
                발행
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
              {selectedUser?.name}님에게 포인트를 지급합니다
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
              >
                취소
              </Button>
              <Button
                onClick={handleIssuePoints}
                className="bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe"
              >
                지급
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

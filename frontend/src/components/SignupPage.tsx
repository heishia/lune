import { useState } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import logo from "figma:asset/e95f335bacb8348ed117f587f5d360e078bf26b6.png";
import { Checkbox } from "./ui/checkbox";

interface SignupPageProps {
  onSignup: (email: string, name: string) => void;
  onBack: () => void;
  onLoginClick?: () => void;
}

export function SignupPage({ onSignup, onBack, onLoginClick }: SignupPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!name || !email || !password || !confirmPassword || !phone) {
      toast.error("모든 필수 항목을 입력해주세요");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }

    if (password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다");
      return;
    }

    if (!agreeTerms || !agreePrivacy) {
      toast.error("필수 약관에 동의해주세요");
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("올바른 이메일 형식이 아닙니다");
      return;
    }

    // 전화번호 형식 검사 (숫자만)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone.replace(/-/g, ""))) {
      toast.error("올바른 전화번호 형식이 아닙니다 (10-11자리 숫자)");
      return;
    }

    // 회원가입 처리
    onSignup(email, name);
    toast.success("회원가입이 완료되었습니다!");
    
    // 로그인 페이지로 이동
    if (onLoginClick) {
      onLoginClick();
    } else {
      onBack();
    }
  };

  const handleAgreeAll = (checked: boolean) => {
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeMarketing(checked);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-brand-warm-taupe/20 z-50">
        <div className="relative flex items-center justify-center px-4 py-4">
          <button 
            onClick={onBack}
            className="absolute left-4 p-2 hover:bg-brand-warm-taupe/10 rounded-md transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-brand-terra-cotta" />
          </button>
          <img src={logo} alt="LUNE" className="h-8 w-auto" />
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-2xl text-brand-terra-cotta tracking-wider">회원가입</h1>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-brand-terra-cotta text-sm">
                이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="bg-white border-brand-warm-taupe/30 text-brand-terra-cotta h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-brand-terra-cotta text-sm">
                이메일 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                className="bg-white border-brand-warm-taupe/30 text-brand-terra-cotta h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-brand-terra-cotta text-sm">
                휴대폰 번호 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678 (하이픈 없이)"
                className="bg-white border-brand-warm-taupe/30 text-brand-terra-cotta h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-brand-terra-cotta text-sm">
                비밀번호 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상 입력하세요"
                className="bg-white border-brand-warm-taupe/30 text-brand-terra-cotta h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-brand-terra-cotta text-sm">
                비밀번호 확인 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="bg-white border-brand-warm-taupe/30 text-brand-terra-cotta h-12"
                required
              />
            </div>

            {/* Terms Agreement */}
            <div className="space-y-4 pt-4 border-t border-brand-warm-taupe/20">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="agreeAll"
                  checked={agreeTerms && agreePrivacy && agreeMarketing}
                  onCheckedChange={handleAgreeAll}
                  className="border-brand-terra-cotta data-[state=checked]:bg-brand-terra-cotta"
                />
                <Label 
                  htmlFor="agreeAll" 
                  className="text-brand-terra-cotta cursor-pointer"
                >
                  전체 동의
                </Label>
              </div>

              <div className="ml-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="agreeTerms"
                    checked={agreeTerms}
                    onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                    className="border-brand-warm-taupe/50 data-[state=checked]:bg-brand-terra-cotta"
                  />
                  <Label 
                    htmlFor="agreeTerms" 
                    className="text-sm text-brand-warm-taupe cursor-pointer"
                  >
                    [필수] 이용약관 동의
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="agreePrivacy"
                    checked={agreePrivacy}
                    onCheckedChange={(checked) => setAgreePrivacy(checked as boolean)}
                    className="border-brand-warm-taupe/50 data-[state=checked]:bg-brand-terra-cotta"
                  />
                  <Label 
                    htmlFor="agreePrivacy" 
                    className="text-sm text-brand-warm-taupe cursor-pointer"
                  >
                    [필수] 개인정보 수집 및 이용 동의
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="agreeMarketing"
                    checked={agreeMarketing}
                    onCheckedChange={(checked) => setAgreeMarketing(checked as boolean)}
                    className="border-brand-warm-taupe/50 data-[state=checked]:bg-brand-terra-cotta"
                  />
                  <Label 
                    htmlFor="agreeMarketing" 
                    className="text-sm text-brand-warm-taupe cursor-pointer"
                  >
                    [선택] 마케팅 정보 수신 동의
                  </Label>
                </div>
              </div>
            </div>

            {/* Signup Button */}
            <Button
              type="submit"
              className="w-full bg-brand-terra-cotta text-brand-cream hover:bg-brand-warm-taupe h-12 tracking-wider"
            >
              회원가입
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-brand-warm-taupe">
              이미 계정이 있으신가요?{" "}
              <button
                type="button"
                onClick={onLoginClick || onBack}
                className="text-brand-terra-cotta hover:underline"
              >
                로그인
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
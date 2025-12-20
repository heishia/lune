import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import logo from "figma:asset/e95f335bacb8348ed117f587f5d360e078bf26b6.png";

interface LoginPageProps {
  onLogin: (email: string, token: string) => void;
  onBack: () => void;
  onSignupClick?: () => void;
  onAdminLogin?: () => void;
}

export function LoginPage({ onLogin, onBack, onSignupClick, onAdminLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isKakaoLoading, setIsKakaoLoading] = useState(false);

  // 카카오 로그인 콜백 처리 (URL에서 code 파라미터 확인)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    
    if (code && state === "kakao_login") {
      handleKakaoCallback(code);
    }
  }, []);

  const handleKakaoCallback = async (code: string) => {
    setIsKakaoLoading(true);
    try {
      const { kakaoLogin } = await import("../utils/api");
      const redirectUri = `${window.location.origin}/login`;
      const response = await kakaoLogin(code, redirectUri);
      
      // URL에서 code 파라미터 제거
      window.history.replaceState({}, document.title, "/login");
      
      if (response.user.is_admin && onAdminLogin) {
        onAdminLogin();
        toast.success("관리자로 로그인되었습니다!");
        return;
      }
      
      onLogin(response.user.email, response.token);
      toast.success("카카오 로그인 되었습니다!");
      onBack();
    } catch (error: any) {
      // URL 정리
      window.history.replaceState({}, document.title, "/login");
      toast.error(error.message || "카카오 로그인에 실패했습니다");
    } finally {
      setIsKakaoLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      const { getKakaoLoginUrl } = await import("../utils/api");
      const redirectUri = `${window.location.origin}/login`;
      const response = await getKakaoLoginUrl(redirectUri);
      
      // state 파라미터 추가 (카카오 로그인임을 식별)
      const authUrl = response.auth_url + "&state=kakao_login";
      
      // 카카오 인증 페이지로 리다이렉트
      window.location.href = authUrl;
    } catch (error: any) {
      toast.error(error.message || "카카오 로그인 URL을 가져오는데 실패했습니다");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }

    try {
      const { login } = await import("../utils/api");
      const response = await login({ email, password });
      
      // 관리자 여부 확인
      if (response.user.is_admin && onAdminLogin) {
        onAdminLogin();
        toast.success("관리자로 로그인되었습니다!");
        return;
      }
      
      onLogin(response.user.email, response.token);
      toast.success("로그인 되었습니다!");
      onBack();
    } catch (error: any) {
      toast.error(error.message || "로그인에 실패했습니다");
    }
  };

  // 카카오 콜백 처리 중이면 로딩 표시
  if (isKakaoLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-terra-cotta mx-auto mb-4"></div>
          <p className="text-black/60">카카오 로그인 처리 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-brand-warm-taupe/20 z-50">
        <div className="relative flex items-center justify-center px-4 py-8">
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
      <div className="pt-32 mobile-pt-24 pb-20 mobile-pb-12 px-4 mobile-px-3">
        <div className="max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-12 mobile-mb-8">
            <h1 className="text-2xl mobile-text-xl text-black tracking-wider">로그인</h1>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6 mobile-space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black text-sm mobile-text-xs">
                이메일
              </Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                className="bg-white border-black/20 text-black placeholder:text-black/40 h-12 mobile-h-14 focus:border-black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-black text-sm mobile-text-xs">
                비밀번호
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="bg-white border-black/20 text-black placeholder:text-black/40 h-12 mobile-h-14 focus:border-black"
              />
            </div>

            {/* Remember Me & Find Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-black/70 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-black/30 text-brand-terra-cotta focus:ring-brand-terra-cotta"
                />
                <span>로그인 상태 유지</span>
              </label>
              <button
                type="button"
                onClick={() => toast.info("비밀번호 찾기 기능은 비 중입니다")}
                className="text-black/70 hover:text-brand-terra-cotta transition-colors"
              >
                비밀번호 찾기
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-brand-terra-cotta text-white hover:bg-brand-warm-taupe h-12 mobile-h-14 tracking-wider text-sm mobile-text-base"
            >
              로그인
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8 mobile-my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/10"></div>
            </div>
            <div className="relative flex justify-center text-sm mobile-text-xs">
              <span className="px-4 bg-white text-black/60">또는</span>
            </div>
          </div>

          {/* Sign Up */}
          <div className="space-y-4 mobile-space-y-3">
            <Button
              type="button"
              onClick={onSignupClick || (() => toast.info("회원가입 기능은 준비 중입니다"))}
              className="w-full bg-[#BEA99C] text-white hover:bg-[#B09A8C] h-12 mobile-h-14 tracking-wider text-sm mobile-text-base"
            >
              회원가입
            </Button>

            {/* Social Login */}
            <div className="space-y-3 mobile-space-y-2">
              <button
                type="button"
                onClick={() => toast.info("소셜 로그인 기능은 준비 중입니다")}
                className="w-full h-12 mobile-h-14 border border-black/20 bg-white text-black hover:bg-black/5 transition-colors rounded-md flex items-center justify-center gap-2 text-sm mobile-text-xs"
              >
                <svg className="w-5 h-5 mobile-w-4 mobile-h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google로 계속하기</span>
              </button>

              <button
                type="button"
                onClick={() => toast.info("소셜 로그인 기능은 준비 중입니다")}
                className="w-full h-12 mobile-h-14 bg-[#03C75A] text-white hover:bg-[#02b350] transition-colors rounded-md flex items-center justify-center gap-2 text-sm mobile-text-xs"
              >
                <svg className="w-5 h-5 mobile-w-4 mobile-h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                <span>Naver로 계속하기</span>
              </button>

              <button
                type="button"
                onClick={handleKakaoLogin}
                className="w-full h-12 mobile-h-14 bg-[#FEE500] text-[#000000] hover:bg-[#f5dc00] transition-colors rounded-md flex items-center justify-center gap-2 text-sm mobile-text-xs"
              >
                <svg className="w-5 h-5 mobile-w-4 mobile-h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 3.14-9 7.01 0 2.43 1.58 4.58 4 6.01v3.98l3.64-2.01C11.07 17.99 11.53 18 12 18c4.97 0 9-3.14 9-7.01S16.97 3 12 3z"/>
                </svg>
                <span>Kakao로 계속하기</span>
              </button>
            </div>
          </div>

          {/* Guest Login */}
          <div className="mt-8 mobile-mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm mobile-text-xs text-black/60 hover:text-brand-terra-cotta transition-colors"
            >
              비회원으로 계속하기
            </button>
          </div>

          {/* 개인정보처리방침 링크 */}
          <div className="mt-6 mobile-mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate("/privacy-policy")}
              className="text-xs text-black/40 hover:text-brand-terra-cotta transition-colors underline"
            >
              개인정보처리방침
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
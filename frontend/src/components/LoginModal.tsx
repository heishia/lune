import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string) => void;
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }

    if (isSignUp) {
      toast.success("회원가입이 완료되었습니다!");
      setIsSignUp(false);
    } else {
      onLogin(email);
      toast.success("로그인 되었습니다!");
      onClose();
      setEmail("");
      setPassword("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-brand-cream border-brand-warm-taupe/30">
        <DialogHeader>
          <DialogTitle className="text-brand-terra-cotta tracking-wider text-center">
            {isSignUp ? "회원가입" : "로그인"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isSignUp ? "새 계정을 만듭니다" : "계정에 로그인합니다"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-brand-terra-cotta text-xs tracking-wider">
              이메일
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="이메일을 입력하세요"
              className="bg-white border-brand-warm-taupe/30 text-brand-terra-cotta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-brand-terra-cotta text-xs tracking-wider">
              비밀번호
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white border-brand-warm-taupe/30 text-brand-terra-cotta"
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-brand-terra-cotta text-xs tracking-wider">
                비밀번호 확인
              </Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                className="bg-white border-brand-warm-taupe/30 text-brand-terra-cotta"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-brand-terra-cotta text-brand-cream hover:bg-brand-warm-taupe tracking-wider"
          >
            {isSignUp ? "회원가입" : "로그인"}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-brand-warm-taupe hover:text-brand-terra-cotta transition-colors"
            >
              {isSignUp ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
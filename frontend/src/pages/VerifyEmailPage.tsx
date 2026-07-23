import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { AeroDiagLogo } from "@/components/AeroDiagLogo";
import { ArrowRight, Pencil } from "lucide-react";

const CODE_LENGTH = 6;

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(26);
  const [canResend, setCanResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email is normally passed via state; using a placeholder here
  const email = "gurumadhava759@gmail.com";

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleInput(idx: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = digit;
    setCode(next);
    if (digit && idx < CODE_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace") {
      if (code[idx]) {
        const next = [...code];
        next[idx] = "";
        setCode(next);
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < CODE_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    const next = [...code];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setCode(next);
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.join("").length < CODE_LENGTH) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);
    navigate("/");
  }

  function handleResend() {
    if (!canResend) return;
    setCountdown(30);
    setCanResend(false);
    setCode(Array(CODE_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  }

  const codeComplete = code.join("").length === CODE_LENGTH;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #e8faf8 0%, #f0f4ff 50%, #e8f8f7 100%)",
      }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-180px] right-[-80px] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(175 100% 45% / 0.09) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-100px] left-[-80px] w-[420px] h-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(220 90% 55% / 0.07) 0%, transparent 70%)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="bg-white/85 backdrop-blur border border-white/80 rounded-2xl shadow-xl px-8 py-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-2">
            <AeroDiagLogo size={40} />
          </div>

          <h2 className="font-display font-bold text-xl text-foreground text-center mt-4 mb-2">Verify your email</h2>

          <p className="text-center text-sm mb-1">
            <span className="text-primary font-medium">Enter the verification code sent to your email</span>
          </p>
          <div className="flex items-center justify-center gap-1.5 mb-7">
            <span className="text-primary text-sm font-medium">{email}</span>
            <Link href="/sign-up">
              <button id="edit-email-btn" className="text-primary hover:text-primary/70 transition-colors">
                <Pencil className="w-3 h-3" />
              </button>
            </Link>
          </div>

          <form onSubmit={handleSubmit}>
            {/* OTP inputs */}
            <div className="flex items-center justify-center gap-2 mb-6" onPaste={handlePaste}>
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInput(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`w-11 h-12 rounded-xl text-center text-lg font-bold border-2 bg-secondary/30 text-foreground outline-none transition-all ${
                    digit
                      ? "border-primary bg-primary/5"
                      : "border-border/50 focus:border-primary"
                  }`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            {/* Resend */}
            <div className="text-center mb-6">
              <button
                id="resend-code-btn"
                type="button"
                onClick={handleResend}
                disabled={!canResend}
                className={`text-sm transition-colors ${
                  canResend
                    ? "text-primary font-semibold hover:underline cursor-pointer"
                    : "text-muted-foreground cursor-default"
                }`}
              >
                {canResend
                  ? "Resend code"
                  : `Didn't receive a code? Resend (${countdown}s)`}
              </button>
            </div>

            <button
              id="verify-continue-btn"
              type="submit"
              disabled={!codeComplete || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: "hsl(175, 100%, 32%)" }}
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center mt-5">
            <Link href="/">
              <span className="text-xs text-amber-500 hover:underline cursor-pointer font-medium">Development mode</span>
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

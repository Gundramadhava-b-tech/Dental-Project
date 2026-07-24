import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AeroDiagLogo } from "@/components/AeroDiagLogo";
import { Eye, EyeOff, ArrowRight, AlertCircle, UserPlus, LogIn } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

type Step = "choice" | "form";

export default function SignUpPage() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("choice");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time Validation Rules
  const hasStartedTypingName = name.length > 0;
  const isNameValid = name.trim().length >= 3;

  const hasStartedTypingEmail = email.length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const hasStartedTypingPassword = password.length > 0;
  const isPasswordValid = password.length >= 6;

  const hasStartedTypingConfirmPassword = confirmPassword.length > 0;
  const isConfirmPasswordValid = confirmPassword.length > 0 && confirmPassword === password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !name || !confirmPassword) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { updateProfile } = await import("firebase/auth");
      await updateProfile(userCredential.user, { displayName: name });
      await sendEmailVerification(userCredential.user);
      navigate("/sign-up/verify-email");
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in instead.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err: any) {
      console.error("Google sign-up error:", err);
      if (err?.code !== "auth/popup-closed-by-user") {
        setError(`Google sign-up failed: ${err?.message || err?.code || "Please try again."}`);
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background:
          "linear-gradient(135deg, #e8faf8 0%, #f0f4ff 50%, #e8f8f7 100%)",
      }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-180px] right-[-80px] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(175 100% 45% / 0.09) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-100px] left-[-80px] w-[420px] h-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(220 90% 55% / 0.07) 0%, transparent 70%)" }} />
      </div>

      <AnimatePresence mode="wait">
        {step === "choice" ? (
          /* ── Step 1: New User vs Existing User ── */
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl shadow-2xl px-10 py-12">
              {/* Logo */}
              <div className="flex flex-col items-center mb-8">
                <AeroDiagLogo size={44} />
                <h2 className="font-display font-bold text-2xl mt-4 text-foreground">Welcome to AeroDiag</h2>
                <p className="text-muted-foreground text-sm mt-1.5 text-center">
                  Are you new here, or do you already have an account?
                </p>
              </div>

              {/* Choice cards */}
              <div className="space-y-4">
                {/* New User */}
                <button
                  id="choice-new-user-btn"
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full group flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-border/50 bg-white hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 hover:shadow-md text-left"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    style={{ background: "hsl(175 100% 32% / 0.10)" }}>
                    <UserPlus className="w-5 h-5" style={{ color: "hsl(175, 100%, 32%)" }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">I'm a New User</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Create a new account to get started</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>

                {/* Old / Existing User */}
                <button
                  id="choice-existing-user-btn"
                  type="button"
                  onClick={() => navigate("/sign-in")}
                  className="w-full group flex items-center gap-4 px-5 py-4 rounded-2xl border-2 border-border/50 bg-white hover:border-indigo-400/60 hover:bg-indigo-50/40 transition-all duration-200 hover:shadow-md text-left"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50">
                    <LogIn className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">I Already Have an Account</p>
                    <p className="text-muted-foreground text-xs mt-0.5">Sign in with your existing credentials</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              <p className="text-center mt-6">
                <Link href="/">
                  <span className="text-xs text-amber-500 hover:underline cursor-pointer font-medium">Development mode</span>
                </Link>
              </p>
            </div>
          </motion.div>
        ) : (
          /* ── Step 2: Sign-Up Form (New Users Only) ── */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full max-w-lg"
          >
            <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl shadow-2xl px-10 py-12">
              {/* Back + Logo */}
              <div className="flex flex-col items-center mb-7">
                <AeroDiagLogo size={40} />
                <h2 className="font-display font-bold text-xl mt-3 text-foreground">Create your account</h2>
                <p className="text-muted-foreground text-sm mt-1">Start diagnosing with AeroDiag today.</p>
              </div>

              {/* Error banner */}
              {error && (
                <div className="mb-4 flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google SSO */}
              <button
                id="google-sso-btn"
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-border/60 bg-white text-sm font-medium text-foreground hover:bg-gray-50 hover:border-border transition-all shadow-sm mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {googleLoading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground font-medium">or</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Live Typing Guidance Card */}
                <AnimatePresence>
                  {focusedField && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -10, height: 0 }}
                      className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-900 flex items-start gap-2.5 shadow-sm"
                    >
                      <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-700 shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold uppercase tracking-wider text-[10px] text-teal-700 block">Form Guidance</span>
                        {focusedField === "name" && "Enter a username or full name with at least 3 characters."}
                        {focusedField === "email" && "Enter a valid email address where we can reach you."}
                        {focusedField === "password" && "Enter a password with at least 6 characters."}
                        {focusedField === "confirmPassword" && "Re-type your exact password to confirm."}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Username */}
                <div>
                  <label htmlFor="signup-name" className="block text-sm font-medium text-foreground mb-2">User Name <span className="text-rose-500">*</span></label>
                  <input
                    id="signup-name"
                    type="text"
                    value={name}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your user name"
                    className={`w-full h-12 px-4 rounded-xl text-base bg-secondary/40 border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all shadow-sm ${
                      hasStartedTypingName && !isNameValid ? "border-rose-500 focus:border-rose-500 focus:bg-rose-50/10"
                      : hasStartedTypingName && isNameValid ? "border-emerald-500 focus:border-emerald-500 focus:bg-emerald-50/10"
                      : "border-border/60 focus:border-primary/70 focus:bg-white"
                    }`}
                    required
                  />
                  <AnimatePresence>
                    {hasStartedTypingName && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className={`text-xs mt-1.5 flex items-center gap-1 ${isNameValid ? 'text-emerald-600' : 'text-rose-500'}`}
                      >
                        {isNameValid ? (
                          <><AlertCircle className="w-3.5 h-3.5" /> Looks good!</>
                        ) : (
                          <><AlertCircle className="w-3.5 h-3.5" /> Username must be at least 3 characters</>
                        )}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email Address */}
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-foreground mb-2">Email address <span className="text-rose-500">*</span></label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={`w-full h-12 px-4 rounded-xl text-base bg-secondary/40 border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all shadow-sm ${
                      hasStartedTypingEmail && !isEmailValid ? "border-rose-500 focus:border-rose-500 focus:bg-rose-50/10"
                      : hasStartedTypingEmail && isEmailValid ? "border-emerald-500 focus:border-emerald-500 focus:bg-emerald-50/10"
                      : "border-border/60 focus:border-primary/70 focus:bg-white"
                    }`}
                    required
                  />
                  <AnimatePresence>
                    {hasStartedTypingEmail && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className={`text-xs mt-1.5 flex items-center gap-1 ${isEmailValid ? 'text-emerald-600' : 'text-rose-500'}`}
                      >
                        {isEmailValid ? (
                          <><AlertCircle className="w-3.5 h-3.5" /> Valid email format</>
                        ) : (
                          <><AlertCircle className="w-3.5 h-3.5" /> Please enter a valid email (e.g. user@domain.com)</>
                        )}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-foreground mb-2">Password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password (min 6 chars)"
                      className={`w-full h-12 px-4 pr-11 rounded-xl text-base bg-secondary/40 border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all shadow-sm ${
                        hasStartedTypingPassword && !isPasswordValid ? "border-rose-500 focus:border-rose-500 focus:bg-rose-50/10"
                        : hasStartedTypingPassword && isPasswordValid ? "border-emerald-500 focus:border-emerald-500 focus:bg-emerald-50/10"
                        : "border-border/60 focus:border-primary/70 focus:bg-white"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      id="toggle-password-btn"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {hasStartedTypingPassword && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className={`text-xs mt-1.5 flex items-center gap-1 ${isPasswordValid ? 'text-emerald-600' : 'text-rose-500'}`}
                      >
                        {isPasswordValid ? (
                          <><AlertCircle className="w-3.5 h-3.5" /> Password length requirement met</>
                        ) : (
                          <><AlertCircle className="w-3.5 h-3.5" /> Must be at least 6 characters long</>
                        )}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Verify Password */}
                <div>
                  <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-foreground mb-2">Verify Password <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full h-12 px-4 pr-11 rounded-xl text-base bg-secondary/40 border text-foreground placeholder:text-muted-foreground focus:outline-none transition-all shadow-sm ${
                        hasStartedTypingConfirmPassword && !isConfirmPasswordValid ? "border-rose-500 focus:border-rose-500 focus:bg-rose-50/10"
                        : hasStartedTypingConfirmPassword && isConfirmPasswordValid ? "border-emerald-500 focus:border-emerald-500 focus:bg-emerald-50/10"
                        : "border-border/60 focus:border-primary/70 focus:bg-white"
                      }`}
                      required
                    />
                    <button
                      type="button"
                      id="toggle-confirm-password-btn"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {hasStartedTypingConfirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className={`text-xs mt-1.5 flex items-center gap-1 ${isConfirmPasswordValid ? 'text-emerald-600' : 'text-rose-500'}`}
                      >
                        {isConfirmPasswordValid ? (
                          <><AlertCircle className="w-3.5 h-3.5" /> Passwords match!</>
                        ) : (
                          <><AlertCircle className="w-3.5 h-3.5" /> Passwords do not match</>
                        )}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  id="signup-continue-btn"
                  type="submit"
                  disabled={loading || googleLoading || !isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-white text-base transition-all disabled:opacity-50 hover:shadow-lg hover:-translate-y-0.5 mt-5"
                  style={{ background: "hsl(175, 100%, 32%)" }}
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    <>Create Account <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              {/* Back link */}
              <p className="text-center text-sm text-muted-foreground mt-5">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/sign-in")}
                  className="text-primary font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Sign in
                </button>
              </p>

              <p className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setStep("choice")}
                  className="text-xs text-muted-foreground hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  ← Go back
                </button>
              </p>

              <p className="text-center mt-3">
                <Link href="/">
                  <span className="text-xs text-amber-500 hover:underline cursor-pointer font-medium">Development mode</span>
                </Link>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

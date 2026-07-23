import { Link } from "wouter";
import { motion } from "framer-motion";
import { AeroDiagLogo } from "@/components/AeroDiagLogo";
import { Activity, Shield, Zap, ArrowRight, ChevronRight } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "AI-Powered Analysis",
    desc: "Automated OSA severity scoring with clinical-grade accuracy.",
  },
  {
    icon: Activity,
    title: "Real-Time Diagnostics",
    desc: "Instant airway area, volume, and constriction metrics.",
  },
  {
    icon: Shield,
    title: "Secure & Compliant",
    desc: "Patient data protected with enterprise-grade authentication.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #f0fffe 0%, #e8f8f7 40%, #f0f4ff 100%)" }}>

      {/* Background decorations */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(175 100% 45% / 0.10) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-100px] left-[-80px] w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(220 90% 55% / 0.07) 0%, transparent 70%)" }} />
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="land-mesh" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(175 60% 40% / 0.05)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#land-mesh)" />
        </svg>
      </div>

      {/* Navbar */}
      <header className="relative z-20 flex items-center justify-between px-8 py-5">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <AeroDiagLogo size={32} />
            <div>
              <span className="font-display font-bold text-lg text-foreground leading-tight">AeroDiag</span>
              <p className="text-[9px] text-primary font-bold tracking-widest uppercase leading-none">OSA DIAGNOSTICS</p>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <button id="landing-sign-in-btn" className="px-5 py-2 rounded-xl text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors">
              Sign In
            </button>
          </Link>
          <Link href="/sign-up">
            <button id="landing-get-started-btn" className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow-md transition-all"
              style={{ background: "hsl(175, 100%, 32%)" }}>
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-2xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/5 mb-8">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold tracking-widest uppercase text-primary">AI-Powered OSA Airway Analysis</span>
          </div>

          <h1 className="font-display font-extrabold text-5xl sm:text-6xl leading-[1.05] text-foreground mb-4">
            Clinical Airway Diagnostics,{" "}
            <span className="gradient-text">Simplified</span>
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto mb-10">
            AeroDiag gives clinicians instant OSA severity scoring, airway geometry analysis, and patient management — all in one secure platform.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/sign-up">
              <button id="landing-start-free-btn" className="group flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                style={{ background: "hsl(175, 100%, 32%)" }}>
                Start Free Today
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/sign-in">
              <button id="landing-signin-hero-btn" className="flex items-center gap-1 px-6 py-3.5 rounded-2xl text-foreground font-semibold text-base hover:bg-white/60 transition-all">
                Sign In <ChevronRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl w-full"
        >
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/70 backdrop-blur-sm border border-white/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display font-bold text-sm text-foreground mb-1.5">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} AeroDiag · OSA Diagnostics Platform
      </footer>
    </div>
  );
}

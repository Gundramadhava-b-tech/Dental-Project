import { Link, useLocation } from "wouter";
import { Activity, Users, UploadCloud, LayoutDashboard, Stethoscope, Menu, X, Search, CircleDot, LogOut } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/components/AuthContext";
import { NotificationBar } from "@/components/NotificationBar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/upload", label: "Upload Scan", icon: UploadCloud },
  { href: "/analyses", label: "Analysis Results", icon: Activity },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const userDisplayName = user?.displayName || user?.email?.split("@")[0] || "Reviewing Physician";
  const userInitials = (userDisplayName.substring(0, 2) || "DP").toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in");
  };

  const SidebarContent = () => (
    <>
      <div className="p-7 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 glow-primary">
          <Stethoscope className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg leading-tight tracking-wide text-foreground">AeroDiag</h1>
          <p className="text-[10px] text-primary font-medium tracking-widest uppercase">OSA Analysis Sys</p>
        </div>
      </div>

      <div className="px-4 mb-2">
        <div className="h-px bg-border/50 w-full" />
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        <div className="px-4 mb-3 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
          Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300
                  ${isActive 
                    ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground font-medium"}
                `}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "text-primary translate-x-1" : "text-muted-foreground"}`} />
                <span className={`transition-transform duration-200 ${isActive ? "translate-x-1" : ""}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="glass-panel p-4 rounded-xl flex items-center justify-between gap-3 relative overflow-hidden group">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center border border-border relative z-10 shrink-0">
              <span className="font-display font-bold text-sm text-primary">{userInitials}</span>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-card" />
            </div>
            <div className="relative z-10 min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5 truncate">User</p>
              <p className="text-xs font-semibold text-foreground truncate" title={user?.email || userDisplayName}>
                {user?.email || userDisplayName}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex text-foreground selection:bg-primary/30 relative overflow-hidden" style={{ background: "#ffffff" }}>

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">

        {/* ① White base */}
        <div className="absolute inset-0" style={{ background: "#ffffff" }} />

        {/* ② Subtle teal/blue tint gradients */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 110% 70% at 70% -20%, hsl(175 100% 45% / 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 80%  65% at -10% 50%,  hsl(220 90% 55% / 0.05) 0%, transparent 55%),
            radial-gradient(ellipse 60%  50% at 50%  110%, hsl(260 80% 60% / 0.04) 0%, transparent 50%),
            radial-gradient(ellipse 45%  40% at 100% 30%,  hsl(195 90% 50% / 0.04) 0%, transparent 50%)
          `
        }} />

        {/* ③ Teal crown bloom */}
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[900px] h-[420px] rounded-full" style={{
          background: "radial-gradient(ellipse, hsl(175 100% 45% / 0.07) 0%, transparent 70%)",
          filter: "blur(2px)"
        }} />

        {/* ④ Fine mesh grid */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mesh" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(175 60% 40% / 0.06)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mesh)" />
        </svg>

        {/* ⑤ Soft orbs */}
        <div className="absolute top-[10%] left-[-80px] w-[420px] h-[420px] rounded-full" style={{
          background: "radial-gradient(circle, hsl(220 100% 55% / 0.05) 0%, transparent 65%)",
          filter: "blur(1px)"
        }} />
        <div className="absolute top-[40%] right-[-60px] w-[360px] h-[360px] rounded-full" style={{
          background: "radial-gradient(circle, hsl(175 100% 40% / 0.05) 0%, transparent 65%)",
          filter: "blur(1px)"
        }} />
        <div className="absolute bottom-[-80px] left-[30%] w-[500px] h-[300px] rounded-full" style={{
          background: "radial-gradient(ellipse, hsl(260 80% 60% / 0.04) 0%, transparent 65%)",
          filter: "blur(2px)"
        }} />

        {/* ⑥ Shimmer band */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(125deg, transparent 0%, hsl(175 100% 50% / 0.02) 30%, transparent 55%, hsl(220 90% 65% / 0.02) 75%, transparent 100%)"
        }} />

        {/* ⑦ Teal top divider line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{
          background: "linear-gradient(90deg, transparent 0%, hsl(175 100% 38% / 0.4) 30%, hsl(175 100% 38% / 0.7) 50%, hsl(175 100% 38% / 0.4) 70%, transparent 100%)"
        }} />

        {/* ⑧ ECG pulse — light version */}
        <svg className="absolute bottom-0 left-0 w-full" height="110" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ecgGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="hsl(175,100%,35%)" stopOpacity="0" />
              <stop offset="10%"  stopColor="hsl(175,100%,35%)" stopOpacity="0.7" />
              <stop offset="90%"  stopColor="hsl(175,100%,35%)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="hsl(175,100%,35%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            points="0,68 130,68 155,68 171,38 188,98 204,18 220,112 237,68 370,68 395,68 411,40 428,96 444,20 460,108 478,68 630,68 655,68 671,36 688,98 706,18 722,108 740,68 890,68 915,68 931,40 948,92 964,18 980,108 998,68 1280,68"
            fill="none" stroke="url(#ecgGlow)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            opacity="0.18"
          />
        </svg>
      </div>

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-72 flex-col border-r border-border relative z-10" style={{ background: "#f8fafc" }}>
        {/* Thin gradient accent at the top */}
        <div className="h-[2px] w-full flex-shrink-0" style={{ background: "linear-gradient(90deg, hsl(175,100%,32%) 0%, hsl(175,100%,32%,0.15) 100%)" }} />
        <SidebarContent />
      </aside>

      {/* Mobile Header & Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-border flex items-center justify-between p-4" style={{ background: "#f8fafc" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
          <span className="font-display font-bold text-foreground">AeroDiag</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-foreground">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-0 z-40 bg-background pt-20 flex flex-col"
          >
            <SidebarContent />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:pt-0 pt-16 relative z-10">

        {/* ── Topbar (desktop) ── */}
        <div className="hidden md:flex items-center justify-between gap-4 px-8 h-[64px] border-b border-border backdrop-blur-md sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)" }}>
          {/* Global search */}
          <div className="flex-1 max-w-md relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search patients, scans, or analyses..."
              className="w-full h-10 pl-10 pr-4 rounded-xl text-sm bg-secondary/40 border border-border/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:bg-secondary/60 transition-all"
            />
            <kbd className="hidden lg:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-muted-foreground bg-secondary/80 border border-border/40">
              ⌘K
            </kbd>
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-3">
            {/* System status pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-[11px] font-bold text-emerald-700 tracking-wide">AI ENGINE ONLINE</span>
            </div>

            {/* Date */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/40 border border-border/40">
              <CircleDot className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">
                {format(new Date(), "EEE, MMM d • yyyy")}
              </span>
            </div>

            {/* Notifications Bar & Popover */}
            <NotificationBar />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-8">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="max-w-7xl mx-auto h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  UploadCloud, 
  UserCheck, 
  X, 
  CheckCheck, 
  Trash2, 
  ChevronRight,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, type NotificationItem } from "@/components/NotificationContext";

export function NotificationBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "urgent">("all");
  const popoverRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "unread") return !n.read;
    if (activeTab === "urgent") return n.urgent;
    return true;
  });

  const getCategoryIcon = (category: NotificationItem["category"]) => {
    switch (category) {
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "upload":
        return <UploadCloud className="w-4 h-4 text-cyan-600" />;
      case "system":
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case "patient":
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getCategoryBadgeClass = (category: NotificationItem["category"]) => {
    switch (category) {
      case "alert":
        return "bg-amber-500/10 text-amber-700 border-amber-500/20";
      case "upload":
        return "bg-cyan-500/10 text-cyan-700 border-cyan-500/20";
      case "system":
        return "bg-indigo-500/10 text-indigo-700 border-indigo-500/20";
      case "patient":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  return (
    <>

      {/* ── Bell Icon & Interactive Popover Dropdown ── */}
      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 group overflow-hidden ${
            isOpen
              ? "bg-primary text-primary-foreground shadow-[0_8px_16px_-6px_rgba(var(--primary),0.4)]"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground hover:shadow-md"
          }`}
          aria-label="Notifications"
          title="Notification Center"
        >
          {/* subtle glow effect inside button on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/0 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <Bell className={`w-5 h-5 transition-transform duration-300 ${isOpen ? "scale-90" : "group-hover:scale-110 group-hover:rotate-6"}`} />
          
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 right-2.5 px-1 py-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.6)] border-2 border-background/80"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </button>

        {/* ── Dropdown Popover ── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.96, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 10, scale: 0.98, filter: "blur(4px)" }}
              transition={{ duration: 0.25, type: "spring", damping: 25, stiffness: 300 }}
              className="absolute right-0 mt-3 w-[360px] sm:w-[440px] rounded-3xl bg-background/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col max-h-[600px]"
            >
              {/* Popover Header */}
              <div className="p-5 pb-4 flex items-center justify-between gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-foreground tracking-tight flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/15 text-primary border border-primary/20">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 relative z-10">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="px-3 py-1.5 text-xs text-primary font-semibold hover:bg-primary/10 rounded-xl transition-colors flex items-center gap-1.5"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Mark read</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="Clear all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="px-5 py-2.5 border-y border-border/40 bg-secondary/20 flex items-center gap-2 text-xs overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3.5 py-1.5 rounded-full font-medium transition-all duration-300 shrink-0 ${
                    activeTab === "all"
                      ? "bg-foreground text-background shadow-md"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab("unread")}
                  className={`px-3.5 py-1.5 rounded-full font-medium transition-all duration-300 shrink-0 ${
                    activeTab === "unread"
                      ? "bg-foreground text-background shadow-md"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setActiveTab("urgent")}
                  className={`px-3.5 py-1.5 rounded-full font-medium transition-all duration-300 shrink-0 ${
                    activeTab === "urgent"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500"
                  }`}
                >
                  Urgent ({notifications.filter((n) => n.urgent).length})
                </button>
              </div>

              {/* Notification Items List */}
              <div className="flex-1 overflow-y-auto divide-y divide-border/30 bg-background/50">
                {filteredNotifications.length === 0 ? (
                  <div className="p-10 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground ring-8 ring-secondary/40">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">No notifications</p>
                    <p className="text-xs text-muted-foreground mt-1.5">You're all caught up for today!</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 transition-all duration-300 relative group hover:bg-secondary/40 ${
                        !notif.read ? "bg-primary/[0.03]" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="w-10 h-10 rounded-2xl bg-background border border-border/50 shadow-sm flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform duration-300 group-hover:rotate-3">
                          {getCategoryIcon(notif.category)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className={`px-2 py-0.5 text-[9px] font-extrabold tracking-widest rounded-md border uppercase ${getCategoryBadgeClass(
                                notif.category
                              )}`}
                            >
                              {notif.category}
                            </span>
                            {notif.urgent && (
                              <span className="px-2 py-0.5 text-[9px] font-extrabold tracking-widest rounded-md bg-rose-500/15 text-rose-600 border border-rose-500/20 uppercase shadow-sm animate-pulse">
                                Urgent
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground ml-auto font-medium tabular-nums">
                              {notif.timestamp}
                            </span>
                          </div>

                          <h4
                            className={`text-sm tracking-tight line-clamp-1 ${
                              !notif.read ? "text-foreground font-bold" : "text-foreground/80 font-medium"
                            }`}
                          >
                            {notif.title}
                          </h4>

                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {notif.description}
                          </p>

                          {/* Item Footer / Link */}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            {notif.link ? (
                              <Link href={notif.link}>
                                <span
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    setIsOpen(false);
                                  }}
                                  className="text-[11px] font-bold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer group/link"
                                >
                                  View Details <ChevronRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                                </span>
                              </Link>
                            ) : (
                              <span />
                            )}

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {!notif.read && (
                                <button
                                  onClick={() => markAsRead(notif.id)}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-[11px] font-medium flex items-center justify-center"
                                  title="Mark as read"
                                >
                                  <CheckCheck className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => removeNotification(notif.id)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center justify-center"
                                title="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Unread Indicator Dot */}
                      {!notif.read && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Popover Footer */}
              <div className="px-5 py-3 border-t border-border/40 bg-secondary/10 flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                  AeroDiag Alert System
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Live</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

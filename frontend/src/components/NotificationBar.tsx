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
    bannerVisible,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    dismissBanner,
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

  const urgentUnreadNotifs = notifications.filter((n) => n.urgent && !n.read);

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
      {/* ── Top Announcement Banner (Urgent Alert Bar) ── */}
      <AnimatePresence>
        {bannerVisible && urgentUnreadNotifs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-rose-50 via-amber-50 to-teal-50 border-b border-amber-200/70 px-4 py-2.5 relative z-40"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-2.5 w-2.5 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 hidden sm:inline-block" />
                <p className="text-slate-800 font-medium truncate">
                  <span className="font-bold text-rose-700 uppercase tracking-wide mr-1.5">
                    Critical Alert ({urgentUnreadNotifs.length}):
                  </span>
                  {urgentUnreadNotifs[0].title} — {urgentUnreadNotifs[0].description}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {urgentUnreadNotifs[0].link && (
                  <Link href={urgentUnreadNotifs[0].link}>
                    <span 
                      onClick={() => markAsRead(urgentUnreadNotifs[0].id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-sm cursor-pointer flex items-center gap-1 text-xs"
                    >
                      Review Case <ChevronRight className="w-3 h-3" />
                    </span>
                  </Link>
                )}
                <button
                  onClick={dismissBanner}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-black/5 transition-colors"
                  title="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bell Icon & Interactive Popover Dropdown ── */}
      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-10 h-10 rounded-xl border flex items-center justify-center transition-all group ${
            isOpen
              ? "bg-primary/10 border-primary/50 text-primary shadow-sm"
              : "bg-secondary/40 border-border/40 hover:bg-secondary/70 hover:border-primary/40 text-muted-foreground hover:text-foreground"
          }`}
          aria-label="Notifications"
          title="Notification Center"
        >
          <Bell className="w-4.5 h-4.5 transition-transform group-hover:scale-105" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </button>

        {/* ── Dropdown Popover ── */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-2 w-[340px] sm:w-[420px] rounded-2xl bg-white border border-slate-200/80 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[560px]"
            >
              {/* Popover Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-2">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-teal-100 text-teal-700">
                          {unreadCount} new
                        </span>
                      )}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="px-2.5 py-1 text-xs text-teal-700 font-semibold hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Clear all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="px-4 py-2 bg-slate-50/30 border-b border-slate-100 flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === "all"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab("unread")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === "unread"
                      ? "bg-slate-800 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Unread ({unreadCount})
                </button>
                <button
                  onClick={() => setActiveTab("urgent")}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === "urgent"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Urgent ({notifications.filter((n) => n.urgent).length})
                </button>
              </div>

              {/* Notification Items List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No notifications</p>
                    <p className="text-xs text-slate-400 mt-1">You are all caught up!</p>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3.5 transition-colors relative group hover:bg-slate-50/80 ${
                        !notif.read ? "bg-teal-50/20" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                          {getCategoryIcon(notif.category)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold tracking-wide rounded-md border uppercase ${getCategoryBadgeClass(
                                notif.category
                              )}`}
                            >
                              {notif.category}
                            </span>
                            {notif.urgent && (
                              <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded bg-rose-100 text-rose-700 uppercase">
                                Urgent
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 ml-auto font-medium">
                              {notif.timestamp}
                            </span>
                          </div>

                          <h4
                            className={`text-xs font-bold text-slate-800 line-clamp-1 ${
                              !notif.read ? "text-slate-900 font-extrabold" : ""
                            }`}
                          >
                            {notif.title}
                          </h4>

                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.description}
                          </p>

                          {/* Item Footer / Link */}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            {notif.link ? (
                              <Link href={notif.link}>
                                <span
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    setIsOpen(false);
                                  }}
                                  className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                                >
                                  View Details <ChevronRight className="w-3 h-3" />
                                </span>
                              </Link>
                            ) : (
                              <span />
                            )}

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              {!notif.read && (
                                <button
                                  onClick={() => markAsRead(notif.id)}
                                  className="p-1 rounded text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors text-[11px] font-medium flex items-center gap-0.5"
                                  title="Mark as read"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => removeNotification(notif.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Remove"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Unread Indicator Dot */}
                      {!notif.read && (
                        <div className="absolute top-4 right-3 w-2 h-2 rounded-full bg-teal-500" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Popover Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
                <p className="text-[11px] font-medium text-slate-400">
                  AeroDiag Diagnostic Alert System • Real-Time Monitoring
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

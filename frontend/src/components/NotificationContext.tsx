import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: "alert" | "system" | "upload" | "patient";
  read: boolean;
  urgent?: boolean;
  link?: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  bannerVisible: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  dismissBanner: () => void;
  addNotification: (item: Omit<NotificationItem, "id" | "timestamp" | "read">) => void;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Severe OSA Alert - John Doe",
    description: "AHI score 34.2 events/hr with critical upper airway collapse at retroglottic region.",
    timestamp: "10m ago",
    category: "alert",
    read: false,
    urgent: true,
    link: "/patients",
  },
  {
    id: "notif-2",
    title: "CBCT Airway Scan Uploaded",
    description: "3D Volumetric Segmentation completed for Patient Sarah Smith (PAS min area: 48.5mm²).",
    timestamp: "45m ago",
    category: "upload",
    read: false,
    urgent: false,
    link: "/analyses",
  },
  {
    id: "notif-3",
    title: "AI Engine Model Updated",
    description: "AeroDiag DeepLearning Airway Segmentation v2.4 initialized with 99.4% precision.",
    timestamp: "2h ago",
    category: "system",
    read: false,
    urgent: false,
  },
  {
    id: "notif-4",
    title: "Moderate OSA Risk - Robert Miller",
    description: "Airway volume: 14.8 cm³. Patient recommended for Mandibular Advancement Device (MAD) evaluation.",
    timestamp: "5h ago",
    category: "alert",
    read: true,
    urgent: true,
    link: "/patients",
  },
  {
    id: "notif-5",
    title: "Diagnostic Report Ready",
    description: "Comprehensive PDF airway report generated for Patient Emily Davis.",
    timestamp: "1d ago",
    category: "patient",
    read: true,
    urgent: false,
    link: "/analyses",
  },
];

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  bannerVisible: true,
  markAsRead: () => {},
  markAllAsRead: () => {},
  removeNotification: () => {},
  clearAll: () => {},
  dismissBanner: () => {},
  addNotification: () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem("aerodiag_notifications");
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [bannerVisible, setBannerVisible] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("aerodiag_banner_dismissed");
      return saved !== "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("aerodiag_notifications", JSON.stringify(notifications));
    } catch (e) {
      console.error("Failed to save notifications to localStorage", e);
    }
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const dismissBanner = () => {
    setBannerVisible(false);
    try {
      localStorage.setItem("aerodiag_banner_dismissed", "true");
    } catch (e) {
      console.error(e);
    }
  };

  const addNotification = (item: Omit<NotificationItem, "id" | "timestamp" | "read">) => {
    const newNotif: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      timestamp: "Just now",
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        bannerVisible,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        dismissBanner,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

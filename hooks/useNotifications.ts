"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  AppNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from "@/lib/services/notification-service";
import { RealtimeChannel } from "@supabase/supabase-js";

// ============================================
// useNotifications Hook
// 실시간 알림 시스템
// ============================================

interface UseNotificationsReturn {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotifications(limit: number = 50): UseNotificationsReturn {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 알림 로드
  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [notifs, count] = await Promise.all([
        getNotifications(user.id, { limit }),
        getUnreadCount(user.id),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (e) {
      console.error("[useNotifications] Load error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, limit]);

  // 초기 로드
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 실시간 구독
  useEffect(() => {
    if (!user) return;

    let channel: RealtimeChannel | null = null;

    channel = subscribeToNotifications(user.id, (newNotification) => {
      // 새 알림을 목록 맨 앞에 추가
      setNotifications((prev) => [newNotification, ...prev].slice(0, limit));
      setUnreadCount((prev) => prev + 1);

      // 브라우저 알림 (권한 있으면)
      if (Notification.permission === "granted") {
        new Notification(newNotification.title, {
          body: newNotification.message || "",
          icon: "/icons/icon-192x192.png",
        });
      }
    });

    return () => {
      if (channel) {
        unsubscribeFromNotifications(channel);
      }
    };
  }, [user, limit]);

  // 단일 알림 읽음 처리
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    const success = await markAsRead(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, []);

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user) return;

    const success = await markAllAsRead(user.id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    }
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    refetch: loadNotifications,
  };
}

// ============================================
// usePostReactions Hook
// 게시물 반응 관리
// ============================================

import {
  ReactionType,
  getMyReactions,
  toggleReaction,
} from "@/lib/services/notification-service";

interface UsePostReactionsReturn {
  reactions: Map<string, ReactionType>;
  isLoading: boolean;
  toggleReaction: (postId: string, type: ReactionType) => Promise<void>;
  getReaction: (postId: string) => ReactionType | null;
}

export function usePostReactions(postIds: string[]): UsePostReactionsReturn {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Map<string, ReactionType>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // 내 반응 로드
  useEffect(() => {
    async function load() {
      if (!user || postIds.length === 0) {
        setReactions(new Map());
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const myReactions = await getMyReactions(user.id, postIds);
        setReactions(myReactions);
      } catch (e) {
        console.error("[usePostReactions] Load error:", e);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, postIds.join(",")]);

  // 반응 토글
  const handleToggleReaction = useCallback(
    async (postId: string, type: ReactionType) => {
      if (!user) return;

      const result = await toggleReaction(user.id, postId, type);

      setReactions((prev) => {
        const next = new Map(prev);
        if (result.newType) {
          next.set(postId, result.newType);
        } else {
          next.delete(postId);
        }
        return next;
      });
    },
    [user]
  );

  // 특정 게시물의 내 반응 조회
  const getReaction = useCallback(
    (postId: string) => reactions.get(postId) || null,
    [reactions]
  );

  return {
    reactions,
    isLoading,
    toggleReaction: handleToggleReaction,
    getReaction,
  };
}

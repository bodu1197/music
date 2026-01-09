"use client";

import { supabase } from "@/lib/supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

// ============================================
// Notification Service
// 실시간 알림 시스템
// ============================================

export interface AppNotification {
  id: string;
  user_id: string;
  type: "like" | "dislike" | "comment" | "reply" | "mention" | "follow" | "new_post";
  title: string;
  message?: string;
  post_id?: string;
  comment_id?: string;
  actor_id?: string;
  actor_name?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

// ============================================
// 알림 조회
// ============================================

/**
 * 사용자의 알림 목록 조회
 */
export async function getNotifications(
  userId: string,
  options?: { limit?: number; unreadOnly?: boolean }
): Promise<AppNotification[]> {
  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq("is_read", false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[NotificationService] Get notifications error:", error);
      return [];
    }

    return (data || []) as AppNotification[];
  } catch (e) {
    console.error("[NotificationService] Get notifications error:", e);
    return [];
  }
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("[NotificationService] Get unread count error:", error);
      return 0;
    }

    return count || 0;
  } catch (e) {
    console.error("[NotificationService] Get unread count error:", e);
    return 0;
  }
}

// ============================================
// 알림 읽음 처리
// ============================================

/**
 * 단일 알림 읽음 처리
 */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_read", false);

    return !error;
  } catch {
    return false;
  }
}

// ============================================
// 실시간 구독
// ============================================

/**
 * 실시간 알림 구독
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: (notification: AppNotification) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("[NotificationService] New notification:", payload);
        onNewNotification(payload.new as AppNotification);
      }
    )
    .subscribe();

  return channel;
}

/**
 * 구독 해제
 */
export function unsubscribeFromNotifications(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}

// ============================================
// 게시물 반응 (좋아요/싫어요)
// ============================================

export type ReactionType = "like" | "dislike";

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

/**
 * 내 반응 조회
 */
export async function getMyReaction(
  userId: string,
  postId: string
): Promise<ReactionType | null> {
  try {
    const { data, error } = await supabase
      .from("post_reactions")
      .select("reaction_type")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    return data.reaction_type as ReactionType;
  } catch {
    return null;
  }
}

/**
 * 여러 게시물에 대한 내 반응 조회
 */
export async function getMyReactions(
  userId: string,
  postIds: string[]
): Promise<Map<string, ReactionType>> {
  const result = new Map<string, ReactionType>();
  if (postIds.length === 0) return result;

  try {
    const { data, error } = await supabase
      .from("post_reactions")
      .select("post_id, reaction_type")
      .eq("user_id", userId)
      .in("post_id", postIds);

    if (error || !data) return result;

    for (const r of data) {
      result.set(r.post_id, r.reaction_type as ReactionType);
    }
  } catch {
    // ignore
  }

  return result;
}

/**
 * 반응 추가/변경
 */
export async function addReaction(
  userId: string,
  postId: string,
  reactionType: ReactionType
): Promise<boolean> {
  try {
    // upsert로 기존 반응 업데이트 또는 새로 추가
    const { error } = await supabase
      .from("post_reactions")
      .upsert(
        {
          post_id: postId,
          user_id: userId,
          reaction_type: reactionType,
        },
        {
          onConflict: "post_id,user_id",
        }
      );

    if (error) {
      console.error("[NotificationService] Add reaction error:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[NotificationService] Add reaction error:", e);
    return false;
  }
}

/**
 * 반응 제거
 */
export async function removeReaction(
  userId: string,
  postId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * 반응 토글 (같은 반응 누르면 취소, 다른 반응 누르면 변경)
 */
export async function toggleReaction(
  userId: string,
  postId: string,
  reactionType: ReactionType
): Promise<{ action: "added" | "removed" | "changed"; newType: ReactionType | null }> {
  const currentReaction = await getMyReaction(userId, postId);

  if (currentReaction === reactionType) {
    // 같은 반응 → 취소
    await removeReaction(userId, postId);
    return { action: "removed", newType: null };
  } else if (currentReaction) {
    // 다른 반응 → 변경
    await addReaction(userId, postId, reactionType);
    return { action: "changed", newType: reactionType };
  } else {
    // 반응 없음 → 추가
    await addReaction(userId, postId, reactionType);
    return { action: "added", newType: reactionType };
  }
}

// ============================================
// 게시물 신고
// ============================================

export type ReportReason = "spam" | "harassment" | "inappropriate" | "other";

/**
 * 게시물 신고
 */
export async function reportPost(
  reporterId: string,
  postId: string,
  reason: ReportReason,
  description?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("post_reports")
      .insert({
        post_id: postId,
        reporter_id: reporterId,
        reason,
        description,
      });

    if (error) {
      if (error.code === "23505") {
        // 이미 신고함
        console.log("[NotificationService] Already reported");
        return true;
      }
      console.error("[NotificationService] Report error:", error);
      return false;
    }

    return true;
  } catch (e) {
    console.error("[NotificationService] Report error:", e);
    return false;
  }
}

/**
 * 이미 신고했는지 확인
 */
export async function hasReported(userId: string, postId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("post_reports")
      .select("id")
      .eq("post_id", postId)
      .eq("reporter_id", userId)
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ============================================
// AI Welcome Post API
// DB에서 환영 공지 조회 (Gemini AI 생성은 Python 백엔드에서)
// ============================================

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RouteContext {
  params: Promise<{ channelId: string }>;
}

/**
 * GET /api/ai/welcome/[channelId]
 *
 * 1. DB에서 기존 환영 공지 조회
 * 2. 있으면 반환, 없으면 null (AI 생성은 백그라운드에서)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const { channelId } = await context.params;

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    // 1. 아티스트 조회 (channel_id로)
    const { data: artist, error: artistError } = await supabaseAdmin
      .from("artists")
      .select("id, name, description")
      .eq("channel_id", channelId)
      .limit(1)
      .maybeSingle();

    if (artistError || !artist) {
      // 아티스트가 없으면 null 반환 (에러 아님)
      return NextResponse.json({ success: false, post: null });
    }

    // 2. 기존 공지 조회
    const { data: announcement, error: announcementError } = await supabaseAdmin
      .from("cafe_announcements")
      .select("*")
      .eq("artist_id", artist.id)
      .eq("type", "welcome")
      .limit(1)
      .maybeSingle();

    if (announcementError) {
      console.error("[AI Welcome] Announcement query error:", announcementError);
      return NextResponse.json({ success: false, post: null });
    }

    // 3. 기존 공지가 있으면 반환
    if (announcement) {
      return NextResponse.json({
        success: true,
        post: {
          content: announcement.content,
          artist_name: artist.name,
          post_type: "welcome",
          is_ai: announcement.is_ai_generated ?? true,
          is_pinned: announcement.is_pinned ?? true,
        },
        from_cache: true,
      });
    }

    // 4. 공지가 없으면 null 반환 (클라이언트에서 처리)
    return NextResponse.json({
      success: false,
      post: null,
      artist_name: artist.name,
    });
  } catch (error) {
    console.error("[AI Welcome] Error:", error);
    return NextResponse.json(
      { success: false, post: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

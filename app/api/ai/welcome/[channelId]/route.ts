import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================
// AI Welcome Post API
// DB에서 조회 → 없으면 Gemini AI로 생성 → DB 저장
// ============================================

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface RouteContext {
  params: Promise<{ channelId: string }>;
}

/**
 * Gemini AI로 환영 메시지 생성
 */
async function generateWelcomeMessage(artistName: string, description?: string): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.error("[AI Welcome] GEMINI_API_KEY not configured");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are ${artistName}, a music artist. Write a warm, friendly welcome message for your fan cafe in Korean.

${description ? `About you: ${description}` : ""}

Requirements:
- Write in Korean (한국어)
- Be warm and welcoming to fans
- Keep it between 2-4 sentences
- Sound authentic and personal
- Don't use hashtags or emojis excessively
- Don't mention this is AI-generated

Example style:
"안녕하세요, 여러분! 제 팬카페에 오신 것을 환영합니다. 항상 응원해주셔서 감사하고, 앞으로도 좋은 음악으로 보답하겠습니다. 함께해요!"`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error("[AI Welcome] Gemini generation error:", error);
    return null;
  }
}

/**
 * GET /api/ai/welcome/[channelId]
 *
 * 1. DB에서 기존 환영 공지 조회
 * 2. 없으면 Gemini AI로 생성 → DB 저장
 * 3. 반환
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

    // 4. 공지가 없으면 AI로 생성
    const generatedContent = await generateWelcomeMessage(artist.name, artist.description);

    if (!generatedContent) {
      // AI 생성 실패 시 기본 메시지
      const defaultContent = `안녕하세요! ${artist.name}의 팬카페에 오신 것을 환영합니다. 함께 좋은 시간 보내요!`;

      // 기본 메시지 저장
      await supabaseAdmin.from("cafe_announcements").insert({
        artist_id: artist.id,
        content: defaultContent,
        type: "welcome",
        is_pinned: true,
        is_ai_generated: false,
      });

      return NextResponse.json({
        success: true,
        post: {
          content: defaultContent,
          artist_name: artist.name,
          post_type: "welcome",
          is_ai: false,
          is_pinned: true,
        },
        from_cache: false,
      });
    }

    // 5. AI 생성 메시지 DB에 저장
    const { error: insertError } = await supabaseAdmin
      .from("cafe_announcements")
      .insert({
        artist_id: artist.id,
        content: generatedContent,
        type: "welcome",
        is_pinned: true,
        is_ai_generated: true,
      });

    if (insertError) {
      console.error("[AI Welcome] Insert error:", insertError);
    }

    return NextResponse.json({
      success: true,
      post: {
        content: generatedContent,
        artist_name: artist.name,
        post_type: "welcome",
        is_ai: true,
        is_pinned: true,
      },
      from_cache: false,
    });
  } catch (error) {
    console.error("[AI Welcome] Error:", error);
    return NextResponse.json(
      { success: false, post: null, error: "Internal server error" },
      { status: 500 }
    );
  }
}

"use client";

import Feed from "@/components/feed/Feed";
import RightSidebar from "@/components/layout/RightSidebar";

export default function Home() {
  return (
    <div className="flex justify-center min-h-screen">
      <div className="w-full max-w-[630px] md:mr-[320px] lg:mr-0">
        <Feed />
      </div>
      <div className="hidden lg:block">
        <RightSidebar />
      </div>
    </div>
  );
}

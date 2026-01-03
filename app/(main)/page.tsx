"use client";



export default function HomePage() {
  return (
    <div className="max-w-[470px] mx-auto pt-8 pb-20 md:pb-8">
      {/* Stories */}
      <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar px-4">
        {Array.from({ length: 6 }, (_, i) => ({ id: `story-${i}`, name: `user_${i}` })).map((story) => (
          <div key={story.id} className="flex flex-col items-center gap-1 min-w-[66px]">
            <div className="w-[66px] h-[66px] rounded-full bg-zinc-800 p-[2px] border-2 border-zinc-700">
              {/* Placeholder Story Circle */}
            </div>
            <span className="text-xs truncate w-full text-center text-zinc-500">{story.name}</span>
          </div>
        ))}
      </div>

      {/* Placeholder Feed */}
      <div className="px-4 text-center py-20 text-zinc-500">
        <p className="mb-2">This is the User Feed (Instagram Style).</p>
        <p className="text-sm">No user posts yet.</p>


      </div>
    </div>
  );
}

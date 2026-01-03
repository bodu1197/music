"use client";

import Post from "@/components/feed/Post";

export default function Feed() {
    // Mock data for initial UI verification
    const posts = [
        {
            id: 1,
            username: "aespa_official",
            avatarUrl: "https://via.placeholder.com/150",
            imageUrl: "https://upload.wikimedia.org/wikipedia/en/9/9e/Aespa_-_My_World.png", // Example Album Art
            caption: "Spicy 🌶️ The new mini album is out now! #aespa #MYWORLD",
            timestamp: "2h",
            likes: 1240393,
        },
        {
            id: 2,
            username: "bts.bighitofficial",
            avatarUrl: "https://via.placeholder.com/150",
            imageUrl: "https://upload.wikimedia.org/wikipedia/en/e/e3/BTS_-_Proof.png",
            caption: "Take Two 💜 Live Performance",
            timestamp: "5h",
            likes: 5620100,
        },
        {
            id: 3,
            username: "newjeans_official",
            avatarUrl: "https://via.placeholder.com/150",
            imageUrl: "https://upload.wikimedia.org/wikipedia/en/3/3a/NewJeans_-_Get_Up.png",
            caption: "Super Shy 🐰 Listen now on VibeStation!",
            timestamp: "1d",
            likes: 893021,
        }
    ];

    return (
        <div className="max-w-[470px] mx-auto pt-8">
            {/* Stories Placeholder */}
            <div className="flex gap-4 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={`story-${i}`} className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-black p-[2px]">
                                <div className="w-full h-full rounded-full bg-zinc-700" />
                            </div>
                        </div>
                        <span className="text-xs text-zinc-400">user_{i}</span>
                    </div>
                ))}
            </div>

            {posts.map((post) => (
                <Post
                    key={post.id}
                    username={post.username}
                    avatarUrl={post.avatarUrl}
                    imageUrl={post.imageUrl}
                    caption={post.caption}
                    timestamp={post.timestamp}
                    likes={post.likes}
                />
            ))}
        </div>
    );
}

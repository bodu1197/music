"use client";

import { ShoppingBag } from "lucide-react";

export default function ShopPage() {
    const products = [
        { id: 1, name: "NewJeans 'Get Up' Bunny Beach Bag", price: "$28.00", image: "/shop/nj1.jpg", artist: "NewJeans" },
        { id: 2, name: "BTS 'Proof' Standard Edition", price: "$55.00", image: "/shop/bts1.jpg", artist: "BTS" },
        { id: 3, name: "BLACKPINK Lightstick Ver.2", price: "$45.00", image: "/shop/bp1.jpg", artist: "BLACKPINK" },
        { id: 4, name: "SEVENTEEN 'FML' Carat Ver.", price: "$18.00", image: "/shop/svt1.jpg", artist: "SEVENTEEN" },
        { id: 5, name: "Twice 'Ready To Be' Digipack", price: "$15.00", image: "/shop/twice1.jpg", artist: "TWICE" },
    ];

    return (
        <div className="max-w-[936px] mx-auto py-8 pb-20 md:pb-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold font-heading mb-2">Vibe Shop</h1>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {["All", "Albums", "Merch", "Fashion", "Digital"].map(cat => (
                        <button key={cat} className="px-4 py-1.5 bg-zinc-800 rounded-full text-sm font-semibold whitespace-nowrap hover:bg-zinc-700">
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                    <div key={product.id} className="group cursor-pointer">
                        <div className="aspect-square bg-zinc-800 rounded-md mb-2 overflow-hidden border border-zinc-800 relative">
                            {/* Image Placeholder */}
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 group-hover:scale-105 transition-transform duration-300">
                                <ShoppingBag className="w-8 h-8 text-zinc-700" />
                            </div>
                            <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs font-bold backdrop-blur-sm">
                                {product.price}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                            <p className="text-xs text-zinc-400">{product.artist}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

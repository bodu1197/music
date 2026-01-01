"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username,
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;
            // Ideally show a message to check email, but for now redirect or auto-login
            router.push("/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
            <div className="w-full max-w-xs space-y-4">
                <div className="border border-zinc-800 p-8 rounded-sm bg-black">
                    <div className="flex justify-center mb-4">
                        <h1 className="text-3xl font-heading bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text font-bold">VibeStation</h1>
                    </div>

                    <h2 className="text-zinc-400 font-bold text-center mb-4 text-sm leading-5">
                        Sign up to see photos and videos from your friends.
                    </h2>

                    <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 rounded-md text-sm mb-4">
                        Log in with Facebook
                    </Button>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px bg-zinc-800 flex-1" />
                        <span className="text-xs text-zinc-500 font-bold">OR</span>
                        <div className="h-px bg-zinc-800 flex-1" />
                    </div>

                    <form onSubmit={handleSignup} className="space-y-2">
                        <input
                            type="email"
                            placeholder="Mobile Number or Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 text-white"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 text-white"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 text-white"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-zinc-500 text-white"
                            required
                        />

                        {error && <p className="text-red-500 text-xs text-center py-2">{error}</p>}

                        <p className="text-[10px] text-zinc-400 text-center py-2">
                            By signing up, you agree to our Terms , Privacy Policy and Cookies Policy .
                        </p>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 rounded-md text-sm disabled:opacity-70"
                        >
                            {loading ? "Signing up..." : "Sign up"}
                        </Button>
                    </form>
                </div>

                <div className="border border-zinc-800 p-4 rounded-sm bg-black text-center">
                    <p className="text-sm">
                        Have an account?{" "}
                        <Link href="/login" className="font-bold text-blue-400 hover:text-white">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

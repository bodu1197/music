"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            router.push("/");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
            <div className="w-full max-w-xs space-y-4">
                <div className="border border-zinc-800 p-8 rounded-sm bg-black">
                    <div className="flex justify-center mb-8">
                        <h1 className="text-3xl font-heading bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text font-bold">VibeStation</h1>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-2">
                        <input
                            type="email"
                            placeholder="Phone number, username, or email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 rounded-md text-sm mt-4 disabled:opacity-70"
                        >
                            {loading ? "Logging in..." : "Log in"}
                        </Button>
                    </form>

                    <div className="flex items-center gap-4 my-4">
                        <div className="h-px bg-zinc-800 flex-1" />
                        <span className="text-xs text-zinc-500 font-bold">OR</span>
                        <div className="h-px bg-zinc-800 flex-1" />
                    </div>

                    <div className="flex justify-center">
                        <button className="text-sm font-bold text-indigo-400 hover:text-white flex items-center gap-2">
                            Log in with Facebook
                        </button>
                    </div>
                    <div className="flex justify-center mt-3">
                        <Link href="/forgot-password" className="text-xs text-zinc-400 hover:text-zinc-200">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <div className="border border-zinc-800 p-4 rounded-sm bg-black text-center">
                    <p className="text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="font-bold text-blue-400 hover:text-white">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

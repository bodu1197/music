"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface LibraryTrack {
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration?: string;
    addedAt: string;
}

export interface LibraryFolder {
    id: string;
    name: string;
    icon: string;
    color: string;
    tracks: LibraryTrack[];
    isDefault?: boolean;
}

interface AddToLibraryModalState {
    isOpen: boolean;
    track: LibraryTrack | null;
}

interface LibraryContextType {
    folders: LibraryFolder[];
    isLoading: boolean;
    addFolder: (name: string, icon?: string) => Promise<void>;
    deleteFolder: (folderId: string) => Promise<void>;
    renameFolder: (folderId: string, newName: string) => Promise<void>;
    addTrackToFolder: (folderId: string, track: LibraryTrack) => Promise<void>;
    removeTrackFromFolder: (folderId: string, videoId: string) => Promise<void>;
    isTrackInFolder: (folderId: string, videoId: string) => boolean;
    isTrackInAnyFolder: (videoId: string) => boolean;
    // Modal control
    openAddToLibraryModal: (track: Omit<LibraryTrack, 'addedAt'>) => void;
    closeAddToLibraryModal: () => void;
    addToLibraryModal: AddToLibraryModalState;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

const DEFAULT_FOLDERS: LibraryFolder[] = [
    {
        id: "liked",
        name: "좋아요한 노래",
        icon: "❤️",
        color: "#ff4d6d",
        tracks: [],
        isDefault: true,
    },
];

export function LibraryProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [folders, setFolders] = useState<LibraryFolder[]>(DEFAULT_FOLDERS);
    const [isLoading, setIsLoading] = useState(true);
    const [addToLibraryModal, setAddToLibraryModal] = useState<AddToLibraryModalState>({
        isOpen: false,
        track: null,
    });

    // Load from Supabase on mount
    useEffect(() => {
        loadFromSupabase();
    }, []);

    const loadFromSupabase = async () => {
        try {
            setIsLoading(true);

            // Load folders
            const { data: foldersData, error: foldersError } = await supabase
                .from("library_folders")
                .select("*")
                .order("created_at", { ascending: true });

            if (foldersError) {
                console.error("Error loading folders:", foldersError);
                return;
            }

            // Load tracks
            const { data: tracksData, error: tracksError } = await supabase
                .from("library_tracks")
                .select("*")
                .order("added_at", { ascending: false });

            if (tracksError) {
                console.error("Error loading tracks:", tracksError);
                return;
            }

            // Map to local format
            const loadedFolders: LibraryFolder[] = (foldersData || []).map(folder => ({
                id: folder.id,
                name: folder.name,
                icon: folder.icon || "📁",
                color: folder.color || "#667eea",
                isDefault: folder.is_default || false,
                tracks: (tracksData || [])
                    .filter(track => track.folder_id === folder.id)
                    .map(track => ({
                        videoId: track.video_id,
                        title: track.title,
                        artist: track.artist,
                        thumbnail: track.thumbnail,
                        duration: track.duration,
                        addedAt: track.added_at,
                    })),
            }));

            // Add default folder if no folders exist
            if (loadedFolders.length === 0) {
                // Create default folder in Supabase
                const { data: newFolder, error } = await supabase
                    .from("library_folders")
                    .insert({
                        name: "좋아요한 노래",
                        icon: "❤️",
                        color: "#ff4d6d",
                        is_default: true,
                    })
                    .select()
                    .single();

                if (!error && newFolder) {
                    loadedFolders.push({
                        id: newFolder.id,
                        name: newFolder.name,
                        icon: newFolder.icon,
                        color: newFolder.color,
                        isDefault: true,
                        tracks: [],
                    });
                }
            }

            setFolders(loadedFolders.length > 0 ? loadedFolders : DEFAULT_FOLDERS);
        } catch (e) {
            console.error("Error loading library:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const addFolder = useCallback(async (name: string, icon = "📁") => {
        try {
            const { data, error } = await supabase
                .from("library_folders")
                .insert({
                    name,
                    icon,
                    color: "#667eea",
                })
                .select()
                .single();

            if (error) {
                console.error("Error adding folder:", error);
                return;
            }

            if (data) {
                const newFolder: LibraryFolder = {
                    id: data.id,
                    name: data.name,
                    icon: data.icon,
                    color: data.color,
                    tracks: [],
                };
                setFolders(prev => [...prev, newFolder]);
            }
        } catch (e) {
            console.error("Error adding folder:", e);
        }
    }, []);

    const deleteFolder = useCallback(async (folderId: string) => {
        try {
            const { error } = await supabase
                .from("library_folders")
                .delete()
                .eq("id", folderId);

            if (error) {
                console.error("Error deleting folder:", error);
                return;
            }

            setFolders(prev => prev.filter(f => f.id !== folderId));
        } catch (e) {
            console.error("Error deleting folder:", e);
        }
    }, []);

    const renameFolder = useCallback(async (folderId: string, newName: string) => {
        try {
            const { error } = await supabase
                .from("library_folders")
                .update({ name: newName })
                .eq("id", folderId);

            if (error) {
                console.error("Error renaming folder:", error);
                return;
            }

            setFolders(prev =>
                prev.map(f => (f.id === folderId ? { ...f, name: newName } : f))
            );
        } catch (e) {
            console.error("Error renaming folder:", e);
        }
    }, []);

    const addTrackToFolder = useCallback(async (folderId: string, track: LibraryTrack) => {
        try {
            // Check if already exists
            const { data: existing } = await supabase
                .from("library_tracks")
                .select("id")
                .eq("folder_id", folderId)
                .eq("video_id", track.videoId)
                .single();

            if (existing) {
                console.log("Track already in folder");
                return;
            }

            const { error } = await supabase
                .from("library_tracks")
                .insert({
                    folder_id: folderId,
                    video_id: track.videoId,
                    title: track.title,
                    artist: track.artist,
                    thumbnail: track.thumbnail,
                    duration: track.duration,
                });

            if (error) {
                console.error("Error adding track:", error);
                return;
            }

            setFolders(prev =>
                prev.map(f =>
                    f.id === folderId
                        ? { ...f, tracks: [...f.tracks, { ...track, addedAt: new Date().toISOString() }] }
                        : f
                )
            );
        } catch (e) {
            console.error("Error adding track:", e);
        }
    }, []);

    const removeTrackFromFolder = useCallback(async (folderId: string, videoId: string) => {
        try {
            const { error } = await supabase
                .from("library_tracks")
                .delete()
                .eq("folder_id", folderId)
                .eq("video_id", videoId);

            if (error) {
                console.error("Error removing track:", error);
                return;
            }

            setFolders(prev =>
                prev.map(f =>
                    f.id === folderId
                        ? { ...f, tracks: f.tracks.filter(t => t.videoId !== videoId) }
                        : f
                )
            );
        } catch (e) {
            console.error("Error removing track:", e);
        }
    }, []);

    const isTrackInFolder = useCallback(
        (folderId: string, videoId: string) => {
            const folder = folders.find(f => f.id === folderId);
            return folder ? folder.tracks.some(t => t.videoId === videoId) : false;
        },
        [folders]
    );

    const isTrackInAnyFolder = useCallback(
        (videoId: string) => {
            return folders.some(f => f.tracks.some(t => t.videoId === videoId));
        },
        [folders]
    );

    const openAddToLibraryModal = useCallback((track: Omit<LibraryTrack, 'addedAt'>) => {
        setAddToLibraryModal({
            isOpen: true,
            track: { ...track, addedAt: new Date().toISOString() },
        });
    }, []);

    const closeAddToLibraryModal = useCallback(() => {
        setAddToLibraryModal({ isOpen: false, track: null });
    }, []);

    return (
        <LibraryContext.Provider
            value={{
                folders,
                isLoading,
                addFolder,
                deleteFolder,
                renameFolder,
                addTrackToFolder,
                removeTrackFromFolder,
                isTrackInFolder,
                isTrackInAnyFolder,
                openAddToLibraryModal,
                closeAddToLibraryModal,
                addToLibraryModal,
            }}
        >
            {children}
        </LibraryContext.Provider>
    );
}

export function useLibrary() {
    const context = useContext(LibraryContext);
    if (!context) {
        throw new Error("useLibrary must be used within a LibraryProvider");
    }
    return context;
}

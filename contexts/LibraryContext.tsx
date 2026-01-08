"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

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
    addFolder: (name: string, icon?: string) => void;
    deleteFolder: (folderId: string) => void;
    renameFolder: (folderId: string, newName: string) => void;
    addTrackToFolder: (folderId: string, track: LibraryTrack) => void;
    removeTrackFromFolder: (folderId: string, videoId: string) => void;
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

const STORAGE_KEY = "vibestation_library";

export function LibraryProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [folders, setFolders] = useState<LibraryFolder[]>(DEFAULT_FOLDERS);
    const [addToLibraryModal, setAddToLibraryModal] = useState<AddToLibraryModalState>({
        isOpen: false,
        track: null,
    });

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setFolders(parsed);
                }
            }
        } catch (e) {
            console.error("Error loading library from localStorage:", e);
        }
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
        } catch (e) {
            console.error("Error saving library to localStorage:", e);
        }
    }, [folders]);

    const addFolder = useCallback((name: string, icon = "📁") => {
        const newFolder: LibraryFolder = {
            id: Date.now().toString(),
            name,
            icon,
            color: "#667eea",
            tracks: [],
        };
        setFolders(prev => [...prev, newFolder]);
    }, []);

    const deleteFolder = useCallback((folderId: string) => {
        setFolders(prev => prev.filter(f => !f.isDefault && f.id !== folderId ? true : f.isDefault));
    }, []);

    const renameFolder = useCallback((folderId: string, newName: string) => {
        setFolders(prev =>
            prev.map(f => (f.id === folderId ? { ...f, name: newName } : f))
        );
    }, []);

    const addTrackToFolder = useCallback((folderId: string, track: LibraryTrack) => {
        setFolders(prev =>
            prev.map(f => {
                if (f.id !== folderId) return f;
                // Check if already exists
                if (f.tracks.some(t => t.videoId === track.videoId)) return f;
                return { ...f, tracks: [...f.tracks, track] };
            })
        );
    }, []);

    const removeTrackFromFolder = useCallback((folderId: string, videoId: string) => {
        setFolders(prev =>
            prev.map(f => {
                if (f.id !== folderId) return f;
                return { ...f, tracks: f.tracks.filter(t => t.videoId !== videoId) };
            })
        );
    }, []);

    const isTrackInFolder = useCallback((folderId: string, videoId: string) => {
        const folder = folders.find(f => f.id === folderId);
        return folder ? folder.tracks.some(t => t.videoId === videoId) : false;
    }, [folders]);

    const isTrackInAnyFolder = useCallback((videoId: string) => {
        return folders.some(f => f.tracks.some(t => t.videoId === videoId));
    }, [folders]);

    const openAddToLibraryModal = useCallback((track: Omit<LibraryTrack, 'addedAt'>) => {
        setAddToLibraryModal({
            isOpen: true,
            track: {
                ...track,
                addedAt: new Date().toISOString(),
            },
        });
    }, []);

    const closeAddToLibraryModal = useCallback(() => {
        setAddToLibraryModal({ isOpen: false, track: null });
    }, []);

    const value: LibraryContextType = {
        folders,
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
    };

    return (
        <LibraryContext.Provider value={value}>
            {children}
        </LibraryContext.Provider>
    );
}

export function useLibrary() {
    const context = useContext(LibraryContext);
    if (context === undefined) {
        throw new Error("useLibrary must be used within a LibraryProvider");
    }
    return context;
}

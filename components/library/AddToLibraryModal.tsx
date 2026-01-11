"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Plus, Check, FolderPlus } from "lucide-react";
import { useLibrary } from "@/contexts/LibraryContext";
import { cn } from "@/lib/utils";

// Helper Hook to manage temporary states (e.g. showing checkmark for 2s)
function useTemporarySet<T>(duration: number = 2000) {
    const [items, setItems] = useState<T[]>([]);
    const timersRef = useRef<Map<T, NodeJS.Timeout>>(new Map());

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            timersRef.current.forEach(timer => clearTimeout(timer));
            timersRef.current.clear();
        };
    }, []);

    const add = useCallback((item: T) => {
        setItems(prev => {
            if (prev.includes(item)) return prev;
            return [...prev, item];
        });

        // Clear existing timer if any
        if (timersRef.current.has(item)) {
            clearTimeout(timersRef.current.get(item)!);
        }

        // Set new timer
        const timer = setTimeout(() => {
            setItems(prev => prev.filter(i => i !== item));
            timersRef.current.delete(item);
        }, duration);

        timersRef.current.set(item, timer);
    }, [duration]);

    const clear = useCallback(() => {
        timersRef.current.forEach(timer => clearTimeout(timer));
        timersRef.current.clear();
        setItems([]);
    }, []);

    return { items, add, clear };
}

// 분리된 하위 컴포넌트: 폴더 아이템
function FolderItem({
    folder,
    track,
    addedToFolders,
    onAddToFolder,
    isTrackInFolder
}: {
    folder: any,
    track: any,
    addedToFolders: string[],
    onAddToFolder: (id: string) => void,
    isTrackInFolder: (folderId: string, trackId: string) => boolean
}) {
    const isInFolder = isTrackInFolder(folder.id, track.videoId);
    const justAdded = addedToFolders.includes(folder.id);

    return (
        <button
            onClick={() => !isInFolder && onAddToFolder(folder.id)}
            disabled={isInFolder}
            className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                isInFolder
                    ? "bg-green-500/20 border border-green-500/30"
                    : "bg-white/5 hover:bg-white/10 border border-transparent"
            )}
        >
            <span className="text-2xl">{folder.icon}</span>
            <div className="flex-1 text-left">
                <p className="text-white font-medium">{folder.name}</p>
                <p className="text-white/50 text-sm">{folder.tracks.length}곡</p>
            </div>
            {(isInFolder || justAdded) && (
                <Check className="w-5 h-5 text-green-400" />
            )}
            {!isInFolder && !justAdded && (
                <Plus className="w-5 h-5 text-white/50" />
            )}
        </button>
    );
}

// 분리된 하위 컴포넌트: 폴더 생성 폼
function FolderCreationForm({
    onCreate,
    onCancel
}: {
    onCreate: (name: string) => void,
    onCancel: () => void
}) {
    const [name, setName] = useState("");

    const handleSubmit = () => {
        if (!name.trim()) return;
        onCreate(name.trim());
        setName("");
    };

    return (
        <div className="p-3 bg-white/5 rounded-xl space-y-3">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="폴더 이름"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#667eea]"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2 bg-white/10 rounded-lg text-white/70 hover:bg-white/20 transition-colors text-sm"
                >
                    취소
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim()}
                    className="flex-1 py-2 bg-[#667eea] rounded-lg text-white font-medium disabled:opacity-50 text-sm"
                >
                    만들기
                </button>
            </div>
        </div>
    );
}

export default function AddToLibraryModal() {
    const {
        addToLibraryModal,
        closeAddToLibraryModal,
        folders,
        addTrackToFolder,
        isTrackInFolder,
        addFolder,
    } = useLibrary();

    const [isCreatingFolder, setIsCreatingFolder] = useState(false);

    // Custom Hook for managing temporary "Added" state
    const { items: addedToFolders, add: markAsAdded, clear: clearAdded } = useTemporarySet<string>();

    if (!addToLibraryModal.isOpen || !addToLibraryModal.track) return null;

    const track = addToLibraryModal.track;

    const handleAddToFolder = async (folderId: string) => {
        await addTrackToFolder(folderId, track);
        markAsAdded(folderId);
    };

    const handleCreateFolder = async (name: string) => {
        await addFolder(name);
        setIsCreatingFolder(false);
    };

    const handleClose = (e?: React.MouseEvent | React.KeyboardEvent) => {
        // Only close if the click/key event target is the dialog itself (backdrop)
        // or if it's an explicit close action (e is undefined or explicitly handled)
        if (e && e.target !== e.currentTarget) return;

        closeAddToLibraryModal();
        setIsCreatingFolder(false);
        clearAdded();
    };

    return (
        <dialog
            open
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] m-0 max-w-none max-h-none w-full h-full border-none"
            onClick={handleClose}
            onKeyDown={(e) => {
                if (e.key === "Escape") handleClose();
            }}
        >
            <div
                className="bg-[#1a1a2e] rounded-2xl w-full max-w-md mx-4 border border-white/10 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">라이브러리에 추가</h2>
                    <button
                        onClick={() => handleClose()}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-white/70" />
                    </button>
                </div>

                {/* Track Preview */}
                <div className="p-4 bg-white/5 flex items-center gap-3">
                    <div
                        className="w-14 h-14 rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${track.thumbnail || '/placeholder-album.png'})` }}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{track.title}</p>
                        <p className="text-white/50 text-sm truncate">{track.artist}</p>
                    </div>
                </div>

                {/* Folders List */}
                <div className="p-4 max-h-[300px] overflow-y-auto">
                    <p className="text-white/60 text-sm mb-3">폴더 선택</p>
                    <div className="space-y-2">
                        {folders.map((folder) => (
                            <FolderItem
                                key={folder.id}
                                folder={folder}
                                track={track}
                                addedToFolders={addedToFolders}
                                onAddToFolder={handleAddToFolder}
                                isTrackInFolder={isTrackInFolder}
                            />
                        ))}

                        {/* Create New Folder */}
                        {isCreatingFolder ? (
                            <FolderCreationForm
                                onCreate={handleCreateFolder}
                                onCancel={() => setIsCreatingFolder(false)}
                            />
                        ) : (
                            <button
                                onClick={() => setIsCreatingFolder(true)}
                                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-white/20 rounded-xl text-white/50 hover:text-white hover:border-[#667eea]/50 transition-all"
                            >
                                <FolderPlus className="w-5 h-5" />
                                <span>새 폴더 만들기</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={() => handleClose()}
                        className="w-full py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        완료
                    </button>
                </div>
            </div>
        </dialog>
    );
}


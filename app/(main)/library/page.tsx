"use client";

import { useState } from "react";
import { Plus, Play, Trash2, Edit2, Music, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/contexts/PlayerContext";
import { useLibrary } from "@/contexts/LibraryContext";
import Image from "next/image";

export default function LibraryPage() {
    const { folders, addFolder, deleteFolder, renameFolder, removeTrackFromFolder } = useLibrary();
    const { setPlaylist, currentTrack, toggleQueue, isQueueOpen } = usePlayer();

    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [editingFolder, setEditingFolder] = useState<string | null>(null);

    const selectedFolder = folders.find(f => f.id === selectedFolderId);

    const createFolder = async () => {
        if (!newFolderName.trim()) return;
        await addFolder(newFolderName.trim());
        setNewFolderName("");
        setIsCreating(false);
    };

    const handleDeleteFolder = async (folderId: string) => {
        await deleteFolder(folderId);
        if (selectedFolderId === folderId) {
            setSelectedFolderId(null);
        }
    };

    const handleRenameFolder = async (folderId: string, newName: string) => {
        await renameFolder(folderId, newName);
        setEditingFolder(null);
    };

    const playFolder = () => {
        if (!selectedFolder || selectedFolder.tracks.length === 0) return;

        const trackList = selectedFolder.tracks.map(t => ({
            videoId: t.videoId,
            title: t.title,
            artist: t.artist,
            thumbnail: t.thumbnail,
        }));

        setPlaylist(trackList, 0);
        if (!isQueueOpen) toggleQueue();
    };

    const playTrack = (trackIndex: number) => {
        if (!selectedFolder || selectedFolder.tracks.length === 0) return;

        const trackList = selectedFolder.tracks.map(t => ({
            videoId: t.videoId,
            title: t.title,
            artist: t.artist,
            thumbnail: t.thumbnail,
        }));

        setPlaylist(trackList, trackIndex);
        if (!isQueueOpen) toggleQueue();
    };

    const handleRemoveTrack = async (videoId: string) => {
        if (!selectedFolderId) return;
        await removeTrackFromFolder(selectedFolderId, videoId);
    };

    return (
        <div className="min-h-screen p-6 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Library</h1>
                    <p className="text-white/60">내 플레이리스트를 만들고 관리하세요</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white font-medium hover:opacity-90 transition-opacity"
                >
                    <FolderPlus className="w-5 h-5" />
                    <span className="hidden sm:inline">새 폴더</span>
                </button>
            </div>

            {/* Create New Folder Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1a1a2e] rounded-2xl p-6 w-full max-w-md mx-4 border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-4">새 폴더 만들기</h2>
                        <input
                            type="text"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="폴더 이름을 입력하세요"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#667eea] mb-4"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && createFolder()}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsCreating(false)}
                                className="flex-1 py-3 bg-white/10 rounded-xl text-white/70 hover:bg-white/20 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={createFolder}
                                disabled={!newFolderName.trim()}
                                className="flex-1 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                만들기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Folders List */}
                <div className="lg:col-span-1">
                    <h2 className="text-lg font-semibold text-white/80 mb-4">폴더 목록</h2>
                    <div className="space-y-2">
                        {folders.map((folder) => (
                            <div
                                key={folder.id}
                                onClick={() => setSelectedFolderId(folder.id)}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all group",
                                    selectedFolderId === folder.id
                                        ? "bg-gradient-to-r from-[#667eea]/30 to-[#764ba2]/30 border border-[#667eea]/50"
                                        : "bg-white/5 hover:bg-white/10 border border-transparent"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{folder.icon}</span>
                                    {editingFolder === folder.id ? (
                                        <input
                                            type="text"
                                            defaultValue={folder.name}
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={(e) => handleRenameFolder(folder.id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleRenameFolder(folder.id, e.currentTarget.value);
                                                }
                                            }}
                                            className="bg-transparent border-b border-[#667eea] text-white outline-none px-1"
                                            autoFocus
                                        />
                                    ) : (
                                        <div>
                                            <p className="text-white font-medium">{folder.name}</p>
                                            <p className="text-white/50 text-sm">{folder.tracks.length}곡</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {folder.tracks.length > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFolderId(folder.id);
                                                setTimeout(playFolder, 100);
                                            }}
                                            className="p-2 bg-[#667eea] rounded-full hover:bg-[#5a6fd6] transition-colors"
                                        >
                                            <Play className="w-4 h-4 text-white fill-white" />
                                        </button>
                                    )}
                                    {!folder.isDefault && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingFolder(folder.id);
                                                }}
                                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4 text-white" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteFolder(folder.id);
                                                }}
                                                className="p-2 bg-red-500/20 rounded-full hover:bg-red-500/40 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Add New Folder Button */}
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/20 rounded-xl text-white/50 hover:text-white hover:border-[#667eea]/50 transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            <span>새 폴더 추가</span>
                        </button>
                    </div>
                </div>

                {/* Selected Folder Content */}
                <div className="lg:col-span-2">
                    {selectedFolder ? (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-4xl">{selectedFolder.icon}</span>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedFolder.name}</h2>
                                        <p className="text-white/60">{selectedFolder.tracks.length}곡</p>
                                    </div>
                                </div>
                                {selectedFolder.tracks.length > 0 && (
                                    <button
                                        onClick={playFolder}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-full text-white font-medium hover:opacity-90 transition-opacity"
                                    >
                                        <Play className="w-5 h-5 fill-white" />
                                        전체 재생
                                    </button>
                                )}
                            </div>

                            {selectedFolder.tracks.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedFolder.tracks.map((track, index) => (
                                        <div
                                            key={track.videoId}
                                            onClick={() => playTrack(index)}
                                            className={cn(
                                                "flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer",
                                                currentTrack?.videoId === track.videoId && "bg-[#667eea]/20"
                                            )}
                                        >
                                            <span className="w-8 text-center text-white/50">{index + 1}</span>
                                            <div className="w-12 h-12 rounded-lg overflow-hidden relative flex-shrink-0">
                                                <Image
                                                    src={track.thumbnail || "/placeholder-album.png"}
                                                    alt={track.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">{track.title}</p>
                                                <p className="text-white/50 text-sm truncate">{track.artist}</p>
                                            </div>
                                            <span className="text-white/40 text-sm">{track.duration || "--:--"}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveTrack(track.videoId);
                                                }}
                                                className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-full transition-all"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <Music className="w-10 h-10 text-white/30" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white/70 mb-2">이 폴더가 비어있어요</h3>
                                    <p className="text-white/50 text-sm max-w-xs">
                                        노래 재생 중 &quot;+&quot; 버튼을 눌러 이 폴더에 추가하세요
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <Music className="w-12 h-12 text-white/30" />
                            </div>
                            <h3 className="text-xl font-medium text-white/70 mb-2">폴더를 선택하세요</h3>
                            <p className="text-white/50 text-sm">
                                왼쪽에서 폴더를 선택하면 노래 목록이 표시됩니다
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

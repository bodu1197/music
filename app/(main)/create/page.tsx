export default function CreatePage() {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
            <h1 className="text-2xl font-bold mb-2">Create new post</h1>
            <div className="w-full max-w-md aspect-square bg-zinc-900 rounded-md border border-zinc-800 flex items-center justify-center mb-4">
                <span className="text-zinc-500">Drag photos and videos here</span>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md font-bold text-sm">
                Select from computer
            </button>
        </div>
    );
}

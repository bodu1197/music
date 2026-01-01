export default function MessagesPage() {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-4">
            <h1 className="text-2xl font-bold mb-2">Messages</h1>
            <p className="text-zinc-400">Send private photos and messages to a friend or group.</p>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md font-bold text-sm">
                Send Message
            </button>
        </div>
    );
}

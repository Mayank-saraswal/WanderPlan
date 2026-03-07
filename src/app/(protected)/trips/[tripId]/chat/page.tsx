"use client";
import { useState, use, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { MessageCircle, Send, Trash2, Calendar, Activity, Hash } from "lucide-react";

type Props = { params: Promise<{ tripId: string }> };

export default function ChatPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { user } = useCurrentUser();
    const messages = useQuery(api.messages.getMessages, { tripId });
    const sendMessage = useMutation(api.messages.sendMessage);
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const trip = useQuery(api.trips.getTrip, { tripId });
    const days = useQuery(api.days.getDays, { tripId });

    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages?.length]);

    if (!messages || !user || !trip) return <PageLoader />;

    const handleSend = async () => {
        if (!input.trim() || sending) return;
        setSending(true);
        try {
            // Parse @day:N mentions
            const dayMatch = input.match(/@day:(\d+)/i);
            const activityMatch = input.match(/@activity:([^\s]+)/i);

            await sendMessage({
                tripId,
                content: input,
                mentionDay: dayMatch ? parseInt(dayMatch[1]) : undefined,
                mentionActivity: activityMatch ? activityMatch[1] : undefined,
            });
            setInput("");
            inputRef.current?.focus();
        } catch {
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    // Format message content to highlight @mentions
    const formatContent = (content: string) => {
        return content
            .replace(/@day:(\d+)/gi, (_match, num) => `📅 Day ${num}`)
            .replace(/@activity:([^\s]+)/gi, (_match, name) => `🎯 ${name}`);
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();

        const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (isToday) return time;
        if (isYesterday) return `Yesterday ${time}`;
        return `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
    };

    return (
        <div className="flex flex-col h-screen">
            {/* Header */}
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">CHAT</h1>
                    <p className="text-xs text-[#0A0A0A]/40 uppercase tracking-wider mt-0.5">
                        {messages.length} message{messages.length !== 1 ? "s" : ""} · {trip.title}
                    </p>
                </div>
            </div>

            {/* Mention helpers */}
            <div className="px-8 py-2 border-b border-[#e5e5e5] flex items-center gap-3 flex-shrink-0 bg-[#fafafa]">
                <span className="text-[10px] text-[#0A0A0A]/30 uppercase tracking-wider font-700">Mentions:</span>
                <div className="flex gap-2">
                    {days && days.slice(0, 5).map((d: any) => (
                        <button key={d._id}
                            onClick={() => setInput(prev => `${prev} @day:${d.dayNumber} `)}
                            className="px-2 py-0.5 text-[10px] bg-blue-50 text-blue-600 font-600 hover:bg-blue-100 transition-colors border border-blue-100"
                        >
                            <Calendar className="w-2.5 h-2.5 inline mr-1" />
                            Day {d.dayNumber}
                        </button>
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                {messages.length === 0 ? (
                    <EmptyState
                        icon={<MessageCircle className="w-8 h-8" strokeWidth={1} />}
                        title="No Messages Yet"
                        description="Start a conversation with your trip members. Use @day:N to mention specific days."
                    />
                ) : (
                    messages.map((msg: any) => {
                        const isMe = msg.authorId === user._id;
                        return (
                            <div key={msg._id} className={`flex gap-3 group ${isMe ? "flex-row-reverse" : ""}`}>
                                {/* Avatar */}
                                {msg.author?.imageUrl ? (
                                    <img src={msg.author.imageUrl} className="w-8 h-8 rounded-full flex-shrink-0" alt="" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#EA580C]/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-700 text-[#EA580C]">{msg.author?.name?.charAt(0) || "?"}</span>
                                    </div>
                                )}

                                {/* Bubble */}
                                <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        {!isMe && <span className="text-xs font-700 text-[#0A0A0A]">{msg.author?.name}</span>}
                                        <span className="text-[10px] text-[#0A0A0A]/30">{formatTime(msg.createdAt)}</span>
                                    </div>
                                    <div className={`px-4 py-2.5 text-sm leading-relaxed ${isMe
                                        ? "bg-[#EA580C] text-white rounded-2xl rounded-tr-sm"
                                        : "bg-[#f5f5f5] text-[#0A0A0A] rounded-2xl rounded-tl-sm border border-[#e5e5e5]"
                                        }`}>
                                        {formatContent(msg.content)}
                                    </div>

                                    {/* Tags for mentions */}
                                    {(msg.mentionDay || msg.mentionActivity) && (
                                        <div className="flex gap-1 mt-1">
                                            {msg.mentionDay && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-600 border border-blue-100">
                                                    <Hash className="w-2.5 h-2.5" /> Day {msg.mentionDay}
                                                </span>
                                            )}
                                            {msg.mentionActivity && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-600 border border-amber-100">
                                                    <Activity className="w-2.5 h-2.5" /> {msg.mentionActivity}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Delete own message */}
                                    {isMe && (
                                        <button
                                            onClick={async () => { await deleteMessage({ messageId: msg._id }); toast.success("Message deleted"); }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#0A0A0A]/20 hover:text-red-500 mt-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-[#e5e5e5] px-8 py-4 flex-shrink-0 bg-white">
                <div className="flex gap-3 items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        placeholder="Type a message... (use @day:1 to mention days)"
                        className="flex-1 border border-[#e5e5e5] px-4 py-3 text-sm focus:outline-none focus:border-[#0A0A0A] transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="bg-[#EA580C] text-white p-3 hover:bg-[#C2410C] transition-colors disabled:opacity-40"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Plane, MapPin, LayoutDashboard, Plus, Bell,
    Calendar, Users, DollarSign, CheckSquare,
    Paperclip, Bookmark, Settings, Lock, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AppSidebar({ inviteCount = 0 }: { inviteCount?: number }) {
    const pathname = usePathname();
    const unreadNotifCount = useConvexQuery(api.notifications.getUnreadCount) ?? 0;
    const totalBadge = inviteCount + unreadNotifCount;

    return (
        <div className="fixed left-0 top-0 h-screen w-56 bg-[#0A0A0A] flex flex-col z-40 border-r border-white/10">
            {/* Logo */}
            <div className="px-5 py-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-[#EA580C]" strokeWidth={1.5} />
                    <span className="font-display text-base font-800 uppercase tracking-widest text-white">WanderPlan</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {/* My Trips */}
                <Link
                    href="/dashboard"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-600 uppercase tracking-wider transition-colors",
                        pathname === "/dashboard"
                            ? "text-[#EA580C] border-l-2 border-[#EA580C] pl-[10px]"
                            : "text-white/50 hover:text-white"
                    )}
                >
                    <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
                    My Trips
                </Link>

                {/* Notifications */}
                <Link
                    href="/notifications"
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-600 uppercase tracking-wider transition-colors",
                        pathname === "/notifications"
                            ? "text-[#EA580C] border-l-2 border-[#EA580C] pl-[10px]"
                            : totalBadge > 0
                                ? "text-[#EA580C]"
                                : "text-white/50 hover:text-white"
                    )}
                >
                    <Bell className="w-4 h-4" strokeWidth={1.5} />
                    Notifications
                    {totalBadge > 0 && (
                        <span className="ml-auto bg-[#EA580C] text-white text-[10px] font-800 min-w-5 h-5 px-1 flex items-center justify-center rounded-full animate-pulse">
                            {totalBadge > 99 ? "99+" : totalBadge}
                        </span>
                    )}
                </Link>

                {/* New Trip */}
                <Link
                    href="/trips/new"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-600 uppercase tracking-wider text-white/50 hover:text-white transition-colors"
                >
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                    New Trip
                </Link>
            </nav>

            {/* User */}
            <div className="px-5 py-5 border-t border-white/10">
                <UserButton
                    appearance={{
                        elements: {
                            avatarBox: "w-8 h-8",
                        },
                    }}
                />
            </div>
        </div>
    );
}

export function TripSidebar({ tripId, isOwner }: { tripId: string; isOwner?: boolean }) {
    const pathname = usePathname();
    const base = `/trips/${tripId}`;

    const navItems = [
        { href: `${base}/overview`, label: "Overview", icon: LayoutDashboard },
        { href: `${base}/itinerary`, label: "Itinerary", icon: Calendar },
        { href: `${base}/members`, label: "Members", icon: Users },
        { href: `${base}/budget`, label: "Budget", icon: DollarSign },
        { href: `${base}/checklists`, label: "Checklists", icon: CheckSquare },
        { href: `${base}/files`, label: "Files", icon: Paperclip },
        { href: `${base}/reservations`, label: "Reservations", icon: Bookmark },
        ...(isOwner ? [{ href: `${base}/settings`, label: "Settings", icon: Settings }] : []),
    ];

    return (
        <div className="fixed left-0 top-0 h-screen w-56 bg-[#0A0A0A] flex flex-col z-40 border-r border-white/10">
            {/* Logo */}
            <div className="px-5 py-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-[#EA580C]" strokeWidth={1.5} />
                    <span className="font-display text-base font-800 uppercase tracking-widest text-white">WanderPlan</span>
                </div>
            </div>

            {/* Back link */}
            <div className="px-5 py-3 border-b border-white/10">
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors uppercase tracking-wider">
                    <ChevronLeft className="w-3 h-3" />
                    All Trips
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {navItems.map((item) => {
                    const active = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-sm font-600 uppercase tracking-wider transition-colors",
                                active
                                    ? "text-[#EA580C] border-l-2 border-[#EA580C] pl-[10px]"
                                    : "text-white/50 hover:text-white"
                            )}
                        >
                            <item.icon className="w-4 h-4" strokeWidth={1.5} />
                            {item.label}
                            {item.icon === Settings && !isOwner && <Lock className="w-3 h-3 ml-auto" />}
                        </Link>
                    );
                })}
            </nav>

            {/* User + Notifications */}
            <div className="px-5 py-5 border-t border-white/10 flex items-center gap-3">
                <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                <NotificationBell />
            </div>
        </div>
    );
}

function NotificationBell() {
    const unreadCount = useConvexQuery(api.notifications.getUnreadCount) ?? 0;

    return (
        <Link href="/dashboard" className="relative ml-auto group">
            <Bell className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" strokeWidth={1.5} />
            {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#EA580C] text-white text-[9px] font-800 w-4 h-4 flex items-center justify-center rounded-full animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </Link>
    );
}

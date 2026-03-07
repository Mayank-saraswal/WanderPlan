"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
    Plane, MapPin, LayoutDashboard, Plus,
    Calendar, Users, DollarSign, CheckSquare,
    Paperclip, Bookmark, Settings, Lock, ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const dashNav = [
    { href: "/dashboard", label: "My Trips", icon: LayoutDashboard },
];

export function AppSidebar() {
    const pathname = usePathname();
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
                {dashNav.map((item) => {
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
                        </Link>
                    );
                })}
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

            {/* User */}
            <div className="px-5 py-5 border-t border-white/10">
                <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
            </div>
        </div>
    );
}

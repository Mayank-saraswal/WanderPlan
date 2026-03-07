"use client";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TripSidebar } from "@/components/layout/Sidebar";
import { PageLoader } from "@/components/shared/EmptyState";
import { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";

export default function TripLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ tripId: string }>;
}) {
    const { tripId } = use(params);
    const trip = useQuery(api.trips.getTrip, { tripId: tripId as Id<"trips"> });
    const role = useQuery(api.tripMembers.getMyRole, { tripId: tripId as Id<"trips"> });

    if (trip === undefined || role === undefined) {
        return (
            <div className="flex min-h-screen bg-white">
                <div className="fixed left-0 top-0 h-screen w-56 bg-[#0A0A0A]" />
                <div className="flex-1 ml-56">
                    <PageLoader />
                </div>
            </div>
        );
    }

    if (trip === null) return notFound();

    return (
        <div className="flex min-h-screen bg-white">
            <TripSidebar tripId={tripId} isOwner={role === "owner"} />
            <main className="flex-1 ml-56">{children}</main>
        </div>
    );
}


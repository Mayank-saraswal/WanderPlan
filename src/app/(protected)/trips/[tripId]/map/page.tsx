"use client";
import { useState, useEffect, use, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader } from "@/components/shared/EmptyState";
import { Map as MapIcon, List, MapPin } from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
    () => import("react-leaflet").then((m) => m.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((m) => m.TileLayer),
    { ssr: false }
);
const MarkerComp = dynamic(
    () => import("react-leaflet").then((m) => m.Marker),
    { ssr: false }
);
const PopupComp = dynamic(
    () => import("react-leaflet").then((m) => m.Popup),
    { ssr: false }
);

const CATEGORY_COLORS: Record<string, string> = {
    transport: "#EA580C",
    accommodation: "#0A0A0A",
    food: "#f59e0b",
    activity: "#374151",
    other: "#6b7280",
};

type GeoResult = { lat: number; lng: number };
const geocodeCache: Record<string, GeoResult | null> = {};

async function geocode(location: string): Promise<GeoResult | null> {
    if (geocodeCache[location] !== undefined) return geocodeCache[location];
    try {
        const resp = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
            { headers: { "User-Agent": "WanderPlan/1.0" } }
        );
        const data = await resp.json();
        if (data && data.length > 0) {
            const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            geocodeCache[location] = result;
            return result;
        }
    } catch { /* ignore */ }
    geocodeCache[location] = null;
    return null;
}

type Props = { params: Promise<{ tripId: string }> };

type MarkerData = {
    id: string;
    title: string;
    location: string;
    lat: number;
    lng: number;
    category: string;
    dayNumber: number;
    startTime?: string;
    cost?: number;
    description?: string;
};

export default function MapPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const trip = useQuery(api.trips.getTrip, { tripId });
    const days = useQuery(api.days.getDays, { tripId });
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState<number | null>(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [customIcon, setCustomIcon] = useState<any>(null);

    // Load Leaflet CSS and create custom icon
    useEffect(() => {
        if (typeof window === "undefined") return;
        // Add Leaflet CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        // Create custom icon after leaflet loads
        import("leaflet").then((L) => {
            const icon = L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
            });
            setCustomIcon(icon);
            setLeafletLoaded(true);
        });

        return () => { document.head.removeChild(link); };
    }, []);

    if (!trip || !days) return <PageLoader />;

    const filteredMarkers = activeDay !== null
        ? markers.filter((m) => m.dayNumber === activeDay)
        : markers;

    const center = filteredMarkers.length > 0
        ? { lat: filteredMarkers.reduce((s, m) => s + m.lat, 0) / filteredMarkers.length, lng: filteredMarkers.reduce((s, m) => s + m.lng, 0) / filteredMarkers.length }
        : { lat: 20, lng: 0 };

    return (
        <div className="flex flex-col h-[calc(100vh-0px)]">
            {/* Header */}
            <div className="border-b border-[#e5e5e5] px-8 py-5 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">MAP VIEW</h1>
                    <span className="bg-[#0A0A0A] text-white text-[10px] font-800 px-2 py-0.5 uppercase tracking-wider">
                        {markers.length} locations
                    </span>
                </div>
            </div>

            {/* Day filter */}
            <div className="border-b border-[#e5e5e5] px-8 flex gap-0 overflow-x-auto flex-shrink-0">
                <button
                    onClick={() => setActiveDay(null)}
                    className={`px-5 py-3 text-xs font-700 uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeDay === null
                        ? "border-[#EA580C] text-[#0A0A0A]"
                        : "border-transparent text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                        }`}
                >
                    All Days
                </button>
                {days.map((day) => (
                    <button
                        key={day._id}
                        onClick={() => setActiveDay(day.dayNumber)}
                        className={`px-5 py-3 text-xs font-700 uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeDay === day.dayNumber
                            ? "border-[#EA580C] text-[#0A0A0A]"
                            : "border-transparent text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
                            }`}
                    >
                        Day {day.dayNumber}
                        {day.date && <span className="ml-1 font-normal normal-case">{format(new Date(day.date), "MMM d")}</span>}
                    </button>
                ))}
            </div>

            {/* Map + Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Map */}
                <div className="flex-1 relative">
                    {(!leafletLoaded || !customIcon) ? (
                        <div className="flex items-center justify-center h-full bg-[#0A0A0A]/5">
                            <div className="text-center">
                                <MapIcon className="w-10 h-10 text-[#0A0A0A]/10 mx-auto mb-2" strokeWidth={1} />
                                <p className="text-xs text-[#0A0A0A]/30">Loading map...</p>
                            </div>
                        </div>
                    ) : (
                        <MapContainer
                            center={[center.lat, center.lng]}
                            zoom={filteredMarkers.length > 0 ? 12 : 2}
                            style={{ height: "100%", width: "100%" }}
                            key={`${center.lat}-${center.lng}-${activeDay}`}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {filteredMarkers.map((m, i) => (
                                <MarkerComp key={m.id} position={[m.lat, m.lng]} icon={customIcon}>
                                    <PopupComp>
                                        <div className="min-w-[180px]">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[m.category] || "#ccc" }} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_COLORS[m.category] }}>
                                                    {m.category}
                                                </span>
                                                <span className="text-[10px] text-gray-400 ml-auto">Day {m.dayNumber}</span>
                                            </div>
                                            <p className="font-bold text-sm">{m.title}</p>
                                            {m.location && <p className="text-xs text-gray-500 mt-0.5">{m.location}</p>}
                                            {m.startTime && <p className="text-xs text-gray-400 mt-1">🕐 {m.startTime}</p>}
                                            {m.cost && <p className="text-xs text-orange-600 font-bold mt-0.5">{trip.currency} {m.cost}</p>}
                                            {m.description && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{m.description}</p>}
                                        </div>
                                    </PopupComp>
                                </MarkerComp>
                            ))}
                        </MapContainer>
                    )}
                </div>

                {/* Sidebar list */}
                <div className="w-72 border-l border-[#e5e5e5] overflow-y-auto flex-shrink-0">
                    <div className="px-4 py-3 border-b border-[#e5e5e5]">
                        <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A]">
                            <List className="w-3 h-3 inline mr-1" />
                            Locations ({filteredMarkers.length})
                        </p>
                    </div>

                    {/* Load activities for each day */}
                    {days.map((day) => (
                        <DayActivityLoader
                            key={day._id}
                            dayId={day._id}
                            dayNumber={day.dayNumber}
                            tripCurrency={trip.currency}
                            onMarkers={(newMarkers) => {
                                setMarkers((prev) => {
                                    const withoutDay = prev.filter((m) => m.dayNumber !== day.dayNumber);
                                    return [...withoutDay, ...newMarkers];
                                });
                            }}
                            show={activeDay === null || activeDay === day.dayNumber}
                        />
                    ))}

                    {filteredMarkers.length === 0 && (
                        <div className="text-center py-12 px-4">
                            <MapPin className="w-8 h-8 text-[#0A0A0A]/10 mx-auto mb-2" strokeWidth={1} />
                            <p className="text-xs text-[#0A0A0A]/30">No locations found.<br />Add locations to activities in the itinerary.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-component that loads activities for a day and geocodes them
function DayActivityLoader({
    dayId, dayNumber, tripCurrency, onMarkers, show
}: {
    dayId: Id<"days">; dayNumber: number; tripCurrency: string;
    onMarkers: (markers: MarkerData[]) => void; show: boolean;
}) {
    const activities = useQuery(api.activities.getActivitiesByDay, { dayId });
    const [geocoded, setGeocoded] = useState(false);

    useEffect(() => {
        if (!activities || geocoded) return;

        const doGeocode = async () => {
            const results: MarkerData[] = [];
            for (const a of activities) {
                if (!a.location) continue;
                const geo = await geocode(a.location);
                if (geo) {
                    results.push({
                        id: a._id,
                        title: a.title,
                        location: a.location,
                        lat: geo.lat,
                        lng: geo.lng,
                        category: a.category,
                        dayNumber,
                        startTime: a.startTime,
                        cost: a.cost,
                        description: a.description,
                    });
                }
            }
            onMarkers(results);
            setGeocoded(true);
        };

        doGeocode();
    }, [activities, geocoded, dayNumber, onMarkers]);

    if (!show || !activities) return null;

    return (
        <div>
            <div className="px-4 py-2 bg-[#0A0A0A]/5 border-b border-[#e5e5e5]">
                <p className="text-[10px] font-700 uppercase tracking-wider text-[#0A0A0A]/40">Day {dayNumber}</p>
            </div>
            {activities.filter((a) => a.location).map((a) => (
                <div key={a._id} className="px-4 py-2.5 border-b border-[#e5e5e5] hover:bg-[#0A0A0A]/5 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[a.category] || "#ccc" }} />
                        <p className="text-xs font-600 text-[#0A0A0A] truncate flex-1">{a.title}</p>
                        {a.startTime && <span className="text-[10px] text-[#0A0A0A]/30 font-mono">{a.startTime}</span>}
                    </div>
                    <p className="text-[10px] text-[#0A0A0A]/40 mt-0.5 ml-4 truncate">{a.location}</p>
                </div>
            ))}
        </div>
    );
}

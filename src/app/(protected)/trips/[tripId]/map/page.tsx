"use client";
import { useState, useEffect, use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader } from "@/components/shared/EmptyState";
import { Map as MapIcon, List, MapPin, Navigation, Clock, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import dynamic from "next/dynamic";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const MarkerComp = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const PopupComp = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const PolylineComp = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });

const CATEGORY_COLORS: Record<string, string> = {
    transport: "#EA580C",
    accommodation: "#0A0A0A",
    food: "#f59e0b",
    activity: "#374151",
    other: "#6b7280",
};

const DAY_COLORS = ["#EA580C", "#0A0A0A", "#f59e0b", "#374151", "#059669", "#7c3aed", "#db2777", "#0284c7"];

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

// Haversine distance calculation (km)
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Format distance
function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}

// Estimate travel time (walking ~5km/h, driving ~40km/h for city)
function estimateTravelTime(km: number): string {
    if (km < 2) {
        const mins = Math.round((km / 5) * 60);
        return `~${mins} min walk`;
    }
    const mins = Math.round((km / 40) * 60);
    return `~${mins} min drive`;
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
    order: number;
};

export default function MapPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const trip = useQuery(api.trips.getTrip, { tripId });
    const days = useQuery(api.days.getDays, { tripId });
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [activeDay, setActiveDay] = useState<number | null>(null);
    const [leafletLoaded, setLeafletLoaded] = useState(false);
    const [customIcon, setCustomIcon] = useState<any>(null);
    const [showRoutes, setShowRoutes] = useState(true);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);

        import("leaflet").then((L) => {
            const icon = L.icon({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
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

    // Sort markers by day and order for route lines
    const sortedMarkers = [...filteredMarkers].sort((a, b) =>
        a.dayNumber !== b.dayNumber ? a.dayNumber - b.dayNumber : a.order - b.order
    );

    // Group by day for route lines
    const markersByDay: Record<number, MarkerData[]> = {};
    sortedMarkers.forEach((m) => {
        if (!markersByDay[m.dayNumber]) markersByDay[m.dayNumber] = [];
        markersByDay[m.dayNumber].push(m);
    });

    const center = filteredMarkers.length > 0
        ? {
            lat: filteredMarkers.reduce((s, m) => s + m.lat, 0) / filteredMarkers.length,
            lng: filteredMarkers.reduce((s, m) => s + m.lng, 0) / filteredMarkers.length
        }
        : { lat: 20, lng: 0 };

    // Calculate total distance for a day
    const getDayDistance = (dayMarkers: MarkerData[]): number => {
        let total = 0;
        for (let i = 1; i < dayMarkers.length; i++) {
            total += haversineDistance(dayMarkers[i - 1].lat, dayMarkers[i - 1].lng, dayMarkers[i].lat, dayMarkers[i].lng);
        }
        return total;
    };

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
                <button
                    onClick={() => setShowRoutes(!showRoutes)}
                    className={`inline-flex items-center gap-2 text-xs font-700 uppercase tracking-wider px-4 py-2.5 border transition-colors ${showRoutes
                        ? "bg-[#EA580C] text-white border-[#EA580C]"
                        : "border-[#e5e5e5] text-[#0A0A0A]/50 hover:border-[#0A0A0A]"
                        }`}
                >
                    <Navigation className="w-3.5 h-3.5" />
                    {showRoutes ? "Routes On" : "Routes Off"}
                </button>
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

                            {/* Route lines between activities */}
                            {showRoutes && Object.entries(markersByDay).map(([dayNum, dayMarkers]) => {
                                if (dayMarkers.length < 2) return null;
                                const color = DAY_COLORS[(parseInt(dayNum) - 1) % DAY_COLORS.length];
                                const positions = dayMarkers.map((m) => [m.lat, m.lng] as [number, number]);
                                return (
                                    <PolylineComp
                                        key={`route-${dayNum}`}
                                        positions={positions}
                                        pathOptions={{
                                            color,
                                            weight: 3,
                                            opacity: 0.7,
                                            dashArray: "8, 8",
                                        }}
                                    />
                                );
                            })}

                            {/* Markers */}
                            {filteredMarkers.map((m) => (
                                <MarkerComp key={m.id} position={[m.lat, m.lng]} icon={customIcon}>
                                    <PopupComp>
                                        <div className="min-w-[200px]">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[m.category] || "#ccc" }} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_COLORS[m.category] }}>
                                                    {m.category}
                                                </span>
                                                <span className="text-[10px] text-gray-400 ml-auto">Day {m.dayNumber}</span>
                                            </div>
                                            <p className="font-bold text-sm">{m.title}</p>
                                            {m.location && <p className="text-xs text-gray-500 mt-0.5">📍 {m.location}</p>}
                                            {m.startTime && <p className="text-xs text-gray-400 mt-1">🕐 {m.startTime}</p>}
                                            {m.cost && <p className="text-xs text-orange-600 font-bold mt-0.5">💰 {trip.currency} {m.cost}</p>}
                                            {m.description && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{m.description}</p>}

                                            {/* Distance to next activity */}
                                            {(() => {
                                                const dayM = markersByDay[m.dayNumber];
                                                if (!dayM) return null;
                                                const idx = dayM.findIndex((dm) => dm.id === m.id);
                                                if (idx < 0 || idx >= dayM.length - 1) return null;
                                                const next = dayM[idx + 1];
                                                const dist = haversineDistance(m.lat, m.lng, next.lat, next.lng);
                                                return (
                                                    <div className="mt-2 pt-2 border-t border-gray-200">
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold">Next stop</p>
                                                        <p className="text-xs font-bold text-gray-700">{next.title}</p>
                                                        <p className="text-[10px] text-orange-600">{formatDistance(dist)} · {estimateTravelTime(dist)}</p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </PopupComp>
                                </MarkerComp>
                            ))}
                        </MapContainer>
                    )}
                </div>

                {/* Sidebar */}
                <div className="w-80 border-l border-[#e5e5e5] overflow-y-auto flex-shrink-0">
                    <div className="px-4 py-3 border-b border-[#e5e5e5]">
                        <p className="text-xs font-700 uppercase tracking-widest text-[#0A0A0A]">
                            <List className="w-3 h-3 inline mr-1" />
                            Route Guide ({filteredMarkers.length} stops)
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
                            allMarkers={markers}
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

// Sub-component that loads activities for a day, geocodes, and shows route info
function DayActivityLoader({
    dayId, dayNumber, tripCurrency, onMarkers, show, allMarkers
}: {
    dayId: Id<"days">; dayNumber: number; tripCurrency: string;
    onMarkers: (markers: MarkerData[]) => void; show: boolean; allMarkers: MarkerData[];
}) {
    const activities = useQuery(api.activities.getActivitiesByDay, { dayId });
    const [geocoded, setGeocoded] = useState(false);

    useEffect(() => {
        if (!activities || geocoded) return;

        const doGeocode = async () => {
            const results: MarkerData[] = [];
            let order = 0;
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
                        order: order++,
                    });
                }
            }
            onMarkers(results);
            setGeocoded(true);
        };

        doGeocode();
    }, [activities, geocoded, dayNumber, onMarkers]);

    if (!show || !activities) return null;

    // Get markers for this day from allMarkers (already geocoded)
    const dayMarkers = allMarkers
        .filter((m) => m.dayNumber === dayNumber)
        .sort((a, b) => a.order - b.order);

    // Calculate total day distance
    let totalDayDistance = 0;
    for (let i = 1; i < dayMarkers.length; i++) {
        totalDayDistance += haversineDistance(
            dayMarkers[i - 1].lat, dayMarkers[i - 1].lng,
            dayMarkers[i].lat, dayMarkers[i].lng
        );
    }

    const dayColor = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];

    return (
        <div>
            <div className="px-4 py-2.5 border-b border-[#e5e5e5] flex items-center justify-between" style={{ backgroundColor: `${dayColor}10` }}>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dayColor }} />
                    <p className="text-[10px] font-700 uppercase tracking-wider text-[#0A0A0A]">Day {dayNumber}</p>
                </div>
                {dayMarkers.length >= 2 && (
                    <span className="text-[10px] font-700 text-[#0A0A0A]/40">
                        {formatDistance(totalDayDistance)} total
                    </span>
                )}
            </div>
            {activities.filter((a) => a.location).map((a, idx, arr) => {
                // Find matching marker for distance calculation
                const marker = dayMarkers.find((m) => m.id === a._id);
                const markerIdx = marker ? dayMarkers.indexOf(marker) : -1;
                const nextMarker = markerIdx >= 0 && markerIdx < dayMarkers.length - 1 ? dayMarkers[markerIdx + 1] : null;
                const dist = marker && nextMarker
                    ? haversineDistance(marker.lat, marker.lng, nextMarker.lat, nextMarker.lng)
                    : null;

                return (
                    <div key={a._id}>
                        <div className="px-4 py-2.5 border-b border-[#e5e5e5] hover:bg-[#0A0A0A]/5 transition-colors cursor-pointer">
                            <div className="flex items-center gap-2">
                                {/* Number badge */}
                                <div className="w-5 h-5 flex items-center justify-center text-[10px] font-800 text-white flex-shrink-0" style={{ backgroundColor: dayColor }}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-600 text-[#0A0A0A] truncate">{a.title}</p>
                                    <p className="text-[10px] text-[#0A0A0A]/40 truncate">{a.location}</p>
                                </div>
                                {a.startTime && <span className="text-[10px] text-[#0A0A0A]/30 font-mono flex-shrink-0">{a.startTime}</span>}
                            </div>
                        </div>

                        {/* Distance indicator between activities */}
                        {dist !== null && (
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-[#0A0A0A]/[0.02]">
                                <div className="flex flex-col items-center">
                                    <div className="w-px h-2 bg-[#0A0A0A]/10" />
                                    <ArrowDown className="w-3 h-3 text-[#0A0A0A]/20" />
                                </div>
                                <div className="flex items-center gap-3 text-[10px]">
                                    <span className="flex items-center gap-1 font-700" style={{ color: dayColor }}>
                                        <Navigation className="w-2.5 h-2.5" />
                                        {formatDistance(dist)}
                                    </span>
                                    <span className="flex items-center gap-1 text-[#0A0A0A]/30">
                                        <Clock className="w-2.5 h-2.5" />
                                        {estimateTravelTime(dist)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

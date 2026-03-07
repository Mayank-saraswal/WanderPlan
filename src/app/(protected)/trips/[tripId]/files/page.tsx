"use client";
import { useState, use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PageLoader, EmptyState } from "@/components/shared/EmptyState";
import { useTripMember } from "@/hooks/useTripMember";
import { toast } from "sonner";
import { Paperclip, Upload, Trash2, Download, FileText, Image, File } from "lucide-react";

const CAT_TABS = ["all", "ticket", "document", "image", "other"] as const;

type Props = { params: Promise<{ tripId: string }> };

function FileIcon({ type }: { type: string }) {
    if (type.includes("pdf")) return <FileText className="w-8 h-8 text-[#EA580C]" strokeWidth={1} />;
    if (type.includes("image")) return <Image className="w-8 h-8 text-[#0A0A0A]" strokeWidth={1} />;
    return <File className="w-8 h-8 text-gray-400" strokeWidth={1} />;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage({ params }: Props) {
    const { tripId: rawTripId } = use(params);
    const tripId = rawTripId as Id<"trips">;
    const { canEdit } = useTripMember(tripId);
    const files = useQuery(api.files.getFiles, { tripId });
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveFile = useMutation(api.files.saveFile);
    const deleteFile = useMutation(api.files.deleteFile);

    const [tab, setTab] = useState<typeof CAT_TABS[number]>("all");
    const [uploading, setUploading] = useState(false);

    if (!files) return <PageLoader />;

    const filtered = tab === "all" ? files : files.filter((f: any) => f.category === tab);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { toast.error("Max file size is 10MB"); return; }

        setUploading(true);
        try {
            const url = await generateUploadUrl();
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
            if (!res.ok) throw new Error("File upload failed");
            const { storageId } = await res.json();

            const cat = file.type.includes("image") ? "image"
                : file.type.includes("pdf") ? "document"
                    : file.name.toLowerCase().includes("ticket") ? "ticket"
                        : "other";

            await saveFile({ tripId, name: file.name, storageId, type: file.type, size: file.size, category: cat });
            toast.success("File uploaded!");
        } catch (err: any) {
            toast.error("Upload failed: " + err.message);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    return (
        <div>
            <div className="border-b border-[#e5e5e5] px-8 py-5">
                <h1 className="font-display text-3xl font-900 uppercase text-[#0A0A0A]">FILES</h1>
            </div>

            {/* Upload zone */}
            {canEdit && (
                <div className="px-8 py-6 border-b border-[#e5e5e5]">
                    <label className="block border-2 border-dashed border-[#e5e5e5] hover:border-[#EA580C] transition-colors cursor-pointer py-10 text-center group">
                        <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                        <Paperclip className="w-6 h-6 text-[#EA580C] mx-auto mb-3" strokeWidth={1.5} />
                        <p className="font-display text-base font-700 uppercase tracking-wider text-[#0A0A0A] group-hover:text-[#EA580C] transition-colors">
                            {uploading ? "Uploading..." : "DROP FILES HERE"}
                        </p>
                        <p className="text-[#0A0A0A]/40 text-xs mt-1">or click to upload — max 10MB</p>
                    </label>
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-[#e5e5e5] px-8 flex gap-0">
                {CAT_TABS.map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-3 text-xs font-700 uppercase tracking-wider border-b-2 transition-colors ${tab === t ? "border-[#EA580C] text-[#0A0A0A]" : "border-transparent text-[#0A0A0A]/40 hover:text-[#0A0A0A]"}`}>
                        {t}
                    </button>
                ))}
            </div>

            {/* Files grid */}
            <div className="px-8 py-6">
                {filtered.length === 0 ? (
                    <EmptyState icon={<Paperclip className="w-8 h-8" strokeWidth={1} />} title="No Files" description="Upload documents, tickets, and images for your trip." />
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filtered.map((f: any) => (
                            <div key={f._id} className="border border-[#e5e5e5] hover:border-[#0A0A0A] transition-colors p-4 group relative">
                                <div className="flex items-center justify-center h-20 mb-3">
                                    {f.type.includes("image") ? (
                                        <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <FileIcon type={f.type} />
                                    )}
                                </div>
                                <p className="text-xs font-600 text-[#0A0A0A] truncate mb-1">{f.name}</p>
                                <p className="text-xs text-[#0A0A0A]/40">{formatSize(f.size)}</p>
                                {f.uploader && (
                                    <p className="text-xs text-[#0A0A0A]/30 flex items-center gap-1 mt-1 truncate">
                                        {f.uploader.imageUrl && <img src={f.uploader.imageUrl} className="w-3 h-3 rounded-full" />}
                                        {f.uploader.name}
                                    </p>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <a href={f.url} target="_blank" rel="noreferrer"
                                        className="p-1 bg-white border border-[#e5e5e5] hover:border-[#0A0A0A] transition-colors">
                                        <Download className="w-3.5 h-3.5 text-[#0A0A0A]" />
                                    </a>
                                    {canEdit && (
                                        <button onClick={() => { deleteFile({ fileId: f._id }); toast.success("Deleted"); }}
                                            className="p-1 bg-white border border-[#e5e5e5] hover:border-red-500 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5 text-[#0A0A0A] hover:text-red-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

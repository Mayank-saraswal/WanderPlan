"use client";

import { useState } from "react";

export function Roles() {
    const [activeTab, setActiveTab] = useState<"owner" | "editor" | "viewer">("owner");

    return (
        <section id="roles" className="py-[120px] px-6 md:px-12 bg-brand-black">
            <div className="reveal">
                <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.18em] uppercase text-brand-orange mb-5">
                    <div className="w-6 h-px bg-brand-orange" />
                    Access Control
                </div>
                <h2 className="font-bebas text-[clamp(48px,6vw,88px)] leading-[0.95] tracking-[0.02em] text-white">
                    THREE ROLES.<br />
                    COMPLETE <span className="text-brand-orange">CONTROL.</span>
                </h2>
            </div>

            <div className="flex border-b border-white/5 mt-16 overflow-x-auto reveal no-scrollbar">
                {(["owner", "editor", "viewer"] as const).map((role) => (
                    <button
                        key={role}
                        onClick={() => setActiveTab(role)}
                        className={`font-bebas text-[20px] tracking-[0.08em] uppercase px-9 py-4 cursor-none transition-colors border-b-2 rounded-none whitespace-nowrap ${activeTab === role
                                ? "text-white border-brand-orange"
                                : "text-gray-500 border-transparent hover:text-white/70"
                            }`}
                    >
                        {role}
                    </button>
                ))}
            </div>

            <div className="mt-16 bg-brand-black min-h-[400px]">
                {activeTab === "owner" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start animate-in fade-in duration-500">
                        <div>
                            <span className="inline-block bg-brand-orange text-black font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1 mb-6 rounded-none">
                                Owner
                            </span>
                            <h3 className="font-bebas text-[48px] text-white mb-4">
                                FULL <span className="text-brand-orange">COMMAND</span>
                            </h3>
                            <p className="text-[15px] text-white/50 leading-[1.7] font-light mb-9 max-w-lg">
                                The trip creator. You own the workspace — manage every member, every setting, every detail. Nothing happens without your say on sensitive actions.
                            </p>
                            <ul className="flex flex-col gap-3">
                                {[
                                    "Delete or archive the trip",
                                    "Invite members and change roles",
                                    "Access trip settings and cover image",
                                    "Edit all itinerary, budget and checklist data",
                                    "Delete any comment in the trip"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/70">
                                        <span className="text-brand-orange text-[10px] mt-1 shrink-0">✦</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-[#111] border border-white/10 p-10 flex flex-col gap-4 rounded-none">
                            <div className="font-mono text-[10px] text-brand-orange tracking-[0.12em] uppercase mb-1">
                                Permission Matrix — Owner
                            </div>
                            {[
                                "Edit trip content",
                                "Manage members",
                                "Delete trip",
                                "Trip settings",
                                "Upload files",
                                "Post comments",
                                "Delete any comment"
                            ].map((perm, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                    <span className="text-[13px] text-white/50">{perm}</span>
                                    <span className="text-brand-orange text-[14px]">✦</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Editor and Viewer components similar pattern */}
                {activeTab === "editor" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start animate-in fade-in duration-500">
                        <div>
                            <span className="inline-block border border-white/30 text-white bg-black font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1 mb-6 rounded-none">
                                Editor
                            </span>
                            <h3 className="font-bebas text-[48px] text-white mb-4">
                                BUILD <span className="text-brand-orange">TOGETHER</span>
                            </h3>
                            <p className="text-[15px] text-white/50 leading-[1.7] font-light mb-9 max-w-lg">
                                Full creative collaborator. Editors can build the itinerary, log expenses, upload files and invite others — just not touch the trip settings or delete it.
                            </p>
                            <ul className="flex flex-col gap-3">
                                {[
                                    "Add, edit and delete activities and days",
                                    "Manage expenses and reservations",
                                    "Invite new members (Editor or Viewer only)",
                                    "Upload and manage files",
                                    "Post and delete own comments"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/70">
                                        <span className="text-brand-orange text-[10px] mt-1 shrink-0">✦</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-[#111] border border-white/10 p-10 flex flex-col gap-4 rounded-none">
                            <div className="font-mono text-[10px] text-brand-orange tracking-[0.12em] uppercase mb-1">
                                Permission Matrix — Editor
                            </div>
                            {[
                                { n: "Edit trip content", v: true },
                                { n: "Invite members", v: true },
                                { n: "Delete trip", v: false },
                                { n: "Trip settings", v: false },
                                { n: "Upload files", v: true },
                                { n: "Post comments", v: true },
                                { n: "Delete any comment", v: false }
                            ].map((perm, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                    <span className="text-[13px] text-white/50">{perm.n}</span>
                                    <span className={perm.v ? "text-brand-orange text-[14px]" : "text-white/15 text-[14px]"}>{perm.v ? "✦" : "—"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "viewer" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-start animate-in fade-in duration-500">
                        <div>
                            <span className="inline-block border border-white/10 text-gray-500 bg-transparent font-mono text-[10px] tracking-[0.15em] uppercase px-3 py-1 mb-6 rounded-none">
                                Viewer
                            </span>
                            <h3 className="font-bebas text-[48px] text-white mb-4">
                                STAY <span className="text-brand-orange">INFORMED</span>
                            </h3>
                            <p className="text-[15px] text-white/50 leading-[1.7] font-light mb-9 max-w-lg">
                                Read-only access to the full trip. Viewers can follow along live, toggle their checklist items, and drop comments — but can't modify the trip structure.
                            </p>
                            <ul className="flex flex-col gap-3">
                                {[
                                    "View all pages and trip data",
                                    "See real-time updates from editors",
                                    "Toggle their own checklist items",
                                    "Post and delete their own comments"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[14px] text-white/70">
                                        <span className="text-brand-orange text-[10px] mt-1 shrink-0">✦</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-[#111] border border-white/10 p-10 flex flex-col gap-4 rounded-none">
                            <div className="font-mono text-[10px] text-brand-orange tracking-[0.12em] uppercase mb-1">
                                Permission Matrix — Viewer
                            </div>
                            {[
                                { n: "View all content", v: true },
                                { n: "Toggle checklist items", v: true },
                                { n: "Post comments", v: true },
                                { n: "Edit trip content", v: false },
                                { n: "Invite members", v: false },
                                { n: "Upload files", v: false },
                                { n: "Delete any content", v: false }
                            ].map((perm, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                    <span className="text-[13px] text-white/50">{perm.n}</span>
                                    <span className={perm.v ? "text-brand-orange text-[14px]" : "text-white/15 text-[14px]"}>{perm.v ? "✦" : "—"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

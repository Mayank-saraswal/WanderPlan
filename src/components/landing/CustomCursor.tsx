"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.body.style.cursor = 'none';
        let mx = -100, my = -100, rx = -100, ry = -100;
        let animationFrameId: number;

        const cursor = cursorRef.current;
        const ring = ringRef.current;

        if (!cursor || !ring) return;

        const handleMouseMove = (e: MouseEvent) => {
            mx = e.clientX;
            my = e.clientY;
        };

        const animCursor = () => {
            cursor.style.left = mx + 'px';
            cursor.style.top = my + 'px';

            rx += (mx - rx) * 0.12;
            ry += (my - ry) * 0.12;

            ring.style.left = rx + 'px';
            ring.style.top = ry + 'px';

            animationFrameId = requestAnimationFrame(animCursor);
        };

        document.addEventListener("mousemove", handleMouseMove);
        animCursor();

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            <div
                ref={cursorRef}
                className="cursor fixed w-3 h-3 bg-brand-orange rounded-full pointer-events-none z-[9999] transition-[transform,background-color] duration-150 transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: '-100px', top: '-100px' }}
            />
            <div
                ref={ringRef}
                className="cursor-ring fixed w-9 h-9 border-[1.5px] border-brand-orange rounded-full pointer-events-none z-[9998] opacity-50 transition-transform duration-300 ease-[cubic-bezier(.23,1,.32,1)] transform -translate-x-1/2 -translate-y-1/2"
                style={{ left: '-100px', top: '-100px' }}
            />
        </>
    );
}

"use client";

import { useEffect } from "react";
import { CustomCursor } from "@/components/landing/CustomCursor";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Marquee } from "@/components/landing/Marquee";
import { Features } from "@/components/landing/Features";
import { AllFeatures } from "@/components/landing/AllFeatures";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Roles } from "@/components/landing/Roles";
import { WanderAI } from "@/components/landing/WanderAI";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
    useEffect(() => {
        // Scroll reveal observer
        const reveals = document.querySelectorAll(".reveal");
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        reveals.forEach((el) => {
            observer.observe(el);
        });

        return () => {
            reveals.forEach((el) => observer.unobserve(el));
            observer.disconnect();
        };
    }, []);

    return (
        <main className="min-h-screen bg-brand-black text-white selection:bg-brand-orange/30 font-sans">
            <CustomCursor />
            <Navbar />
            <Hero />
            <Marquee />
            <Features />
            <AllFeatures />
            <HowItWorks />
            <Roles />
            <WanderAI />
            <CTA />
            <Footer />
        </main>
    );
}

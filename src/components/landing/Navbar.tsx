import Link from "next/link";

export function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[#0A0A0A]/85 backdrop-blur-md border-b border-brand-orange/20">
            <Link href="/" className="font-bebas text-[26px] tracking-[0.12em] text-white decoration-none hover:opacity-90 transition-opacity">
                WANDER<span className="text-brand-orange">PLAN</span>
            </Link>

            <ul className="hidden md:flex gap-9 list-none m-0 p-0">
                <li>
                    <Link href="#features" className="text-[13px] font-medium tracking-[0.08em] uppercase text-gray-500 hover:text-white transition-colors duration-200">
                        Features
                    </Link>
                </li>
                <li>
                    <Link href="#how" className="text-[13px] font-medium tracking-[0.08em] uppercase text-gray-500 hover:text-white transition-colors duration-200">
                        How it works
                    </Link>
                </li>
                <li>
                    <Link href="#roles" className="text-[13px] font-medium tracking-[0.08em] uppercase text-gray-500 hover:text-white transition-colors duration-200">
                        Roles
                    </Link>
                </li>
                <li>
                    <Link href="#ai" className="text-[13px] font-medium tracking-[0.08em] uppercase text-gray-500 hover:text-white transition-colors duration-200">
                        WanderAI
                    </Link>
                </li>
            </ul>

            <Link
                href="/dashboard"
                className="bg-brand-orange text-black text-[13px] font-bold tracking-[0.08em] uppercase px-6 py-2.5 transition-all duration-200 hover:bg-amber-400 hover:-translate-y-[1px] inline-block cursor-none rounded-none"
            >
                Start Planning
            </Link>
        </nav>
    );
}

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="font-display text-4xl font-900 uppercase text-white tracking-wider">
                        WANDER<span className="text-[#EA580C]">PLAN</span>
                    </h1>
                    <p className="text-white/40 mt-2 text-sm">Create your account and start planning</p>
                </div>
                <SignUp
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "bg-white border-0 shadow-none rounded-none",
                            headerTitle: "hidden",
                            headerSubtitle: "hidden",
                        },
                    }}
                    fallbackRedirectUrl="/dashboard"
                />
            </div>
        </div>
    );
}

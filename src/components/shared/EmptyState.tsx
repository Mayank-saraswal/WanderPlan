import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            {icon && (
                <div className="w-16 h-16 border border-[#0A0A0A]/10 flex items-center justify-center mb-6 text-[#EA580C]">
                    {icon}
                </div>
            )}
            <h3 className="font-display text-xl font-700 uppercase tracking-wide text-[#0A0A0A] mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-[#0A0A0A]/50 text-sm max-w-xs leading-relaxed mb-6">{description}</p>
            )}
            {action}
        </div>
    );
}

export function PageLoader() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#EA580C]" />
                <p className="text-[#0A0A0A]/40 text-xs uppercase tracking-widest font-display">Loading...</p>
            </div>
        </div>
    );
}

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    isDestructive?: boolean;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, description, confirmLabel = "Confirm", isDestructive }: ConfirmDialogProps) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-white border border-[#0A0A0A] p-8 max-w-md w-full mx-4">
                <h3 className="font-display text-2xl font-800 uppercase mb-3">{title}</h3>
                <p className="text-[#0A0A0A]/60 text-sm leading-relaxed mb-8">{description}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 border border-[#0A0A0A] py-2.5 text-sm font-600 uppercase tracking-wider hover:bg-[#0A0A0A] hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 py-2.5 text-sm font-600 uppercase tracking-wider transition-colors ${isDestructive
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-[#0A0A0A] text-white hover:bg-[#EA580C]"
                            }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

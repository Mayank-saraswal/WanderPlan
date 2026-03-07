export type Role = "owner" | "editor" | "viewer";

export const PERMISSIONS = {
    owner: [
        "delete_trip", "manage_members", "access_settings",
        "change_member_role", "remove_members",
        "edit_content", "invite_members", "upload_files",
        "view_only", "comment", "toggle_checklist",
        "delete_any_comment",
    ],
    editor: [
        "edit_content", "invite_members", "upload_files",
        "view_only", "comment", "toggle_checklist",
    ],
    viewer: ["view_only", "comment", "toggle_checklist"],
} as const;

export type Permission = (typeof PERMISSIONS)["owner"][number];

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
    if (!role) return false;
    return (PERMISSIONS[role] as readonly string[]).includes(permission);
}

export function canEdit(role: Role | null | undefined): boolean {
    return role === "owner" || role === "editor";
}

export function isOwner(role: Role | null | undefined): boolean {
    return role === "owner";
}

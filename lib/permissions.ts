export type Permission =
    | "manage_wallet"
    | "view_wallet"
    | "manage_fees"
    | "view_fees"
    | "manage_teachers"
    | "view_teachers"
    | "manage_students"
    | "view_students"
    | "manage_parents"
    | "view_parents"
    | "manage_classes"
    | "manage_subjects"
    | "manage_departments"
    | "manage_levels"
    | "manage_sessions"
    | "view_results"
    | "enter_results"
    | "approve_results"
    | "publish_results"
    | "manage_calendar"
    | "manage_events"
    | "manage_settings"
    | "manage_admins";

export interface PermissionGroup {
    name: string;
    permissions: {
        key: Permission;
        label: string;
        description: string;
    }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        name: "Finance",
        permissions: [
            { key: "manage_wallet", label: "Manage Wallet", description: "Can credit/debit and view full wallet history." },
            { key: "view_wallet", label: "View Wallet", description: "Can only view wallet balance and history." },
            { key: "manage_fees", label: "Manage Fees", description: "Can create bills and process payments." },
            { key: "view_fees", label: "View Fees", description: "Can view fee status and payment history." },
        ],
    },
    {
        name: "People",
        permissions: [
            { key: "manage_teachers", label: "Manage Teachers", description: "Can add, edit, and assign teachers." },
            { key: "view_teachers", label: "View Teachers", description: "Can view teacher profiles and assignments." },
            { key: "manage_students", label: "Manage Students", description: "Can enroll, edit, and promote students." },
            { key: "view_students", label: "View Students", description: "Can view student profiles and records." },
            { key: "manage_parents", label: "Manage Parents", description: "Can add and link parents to students." },
            { key: "view_parents", label: "View Parents", description: "Can view parent contact information." },
        ],
    },
    {
        name: "Academics",
        permissions: [
            { key: "manage_classes", label: "Manage Classes", description: "Can create and manage school classes." },
            { key: "manage_subjects", label: "Manage Subjects", description: "Can create and manage subjects." },
            { key: "manage_departments", label: "Manage Departments", description: "Can manage school departments." },
            { key: "manage_levels", label: "Manage Levels", description: "Can manage school grade levels." },
            { key: "manage_sessions", label: "Manage Sessions", description: "Can open/close academic sessions and terms." },
        ],
    },
    {
        name: "Examinations",
        permissions: [
            { key: "view_results", label: "View Results", description: "Can view all student results." },
            { key: "enter_results", label: "Enter Results", description: "Can input marks for any student/subject." },
            { key: "approve_results", label: "Approve Results", description: "Can approve results pending review." },
            { key: "publish_results", label: "Publish Results", description: "Can make results visible to parents/students." },
        ],
    },
    {
        name: "Engagement",
        permissions: [
            { key: "manage_calendar", label: "Manage Calendar", description: "Can manage the school academic calendar." },
            { key: "manage_events", label: "Manage Events", description: "Can create and edit school events." },
        ],
    },
    {
        name: "System",
        permissions: [
            { key: "manage_settings", label: "Manage Settings", description: "Can change school profile and appearance." },
            { key: "manage_admins", label: "Manage Admins", description: "Can add and set permissions for other admins." },
        ],
    },
];

export function hasPermission(userPermissions: any, requiredPermission: Permission): boolean {
    if (!userPermissions) return false;

    // If it's a string (e.g. from database storage)
    let perms = userPermissions;
    if (typeof userPermissions === 'string') {
        try {
            perms = JSON.parse(userPermissions);
        } catch (e) {
            return false;
        }
    }

    // Handle array of strings or object map
    if (Array.isArray(perms)) {
        return perms.includes(requiredPermission);
    } else if (typeof perms === 'object') {
        return perms[requiredPermission] === true;
    }

    return false;
}

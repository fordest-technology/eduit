import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ParentForm from "../parent-form";

export default async function AddParentPage() {
    const session = await getSession();

    if (!session || !["super_admin", "school_admin"].includes(session.role)) {
        redirect("/dashboard");
    }

    return (
        <div className="container mx-auto py-10">
            <ParentForm />
        </div>
    );
} 
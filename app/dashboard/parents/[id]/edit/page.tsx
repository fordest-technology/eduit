import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ParentForm from "../../parent-form";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export default async function EditParentPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await getSession();

    if (!session || !["super_admin", "school_admin"].includes(session.role)) {
        redirect("/dashboard");
    }

    // Fetch the parent data
    const parent = await prisma.user.findUnique({
        where: {
            id: params.id,
            role: Role.PARENT,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            schoolId: true,
        },
    });

    if (!parent) {
        redirect("/dashboard/parents");
    }

    // If school admin, ensure they only edit parents from their school
    if (session.role === "school_admin" && parent.schoolId !== session.schoolId) {
        redirect("/dashboard/parents");
    }

    return (
        <div className="container mx-auto py-10">
            <ParentForm parent={parent} />
        </div>
    );
} 
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ParentForm from "../../parent-form";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { type ParentFormData } from "../../types";

export default async function EditParentPage({
    params,
}: {
    params: { id: string };
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (!session.schoolId) {
        redirect("/dashboard");
    }

    // Only SUPER_ADMIN and SCHOOL_ADMIN can access this page
    if (![UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN].includes(session.role as UserRole)) {
        redirect("/dashboard");
    }

    // Fetch the parent data
    const parent = await prisma.user.findUnique({
        where: {
            id: params.id,
            role: UserRole.PARENT,
            schoolId: session.role === UserRole.SCHOOL_ADMIN ? session.schoolId : undefined,
        },
        select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            schoolId: true,
            parent: {
                select: {
                    phone: true,
                }
            }
        },
    });

    if (!parent) {
        redirect("/dashboard/parents");
    }

    const parentData: ParentFormData = {
        id: parent.id,
        name: parent.name,
        email: parent.email,
        phone: parent.parent?.phone || null,
        profileImage: parent.profileImage,
        schoolId: parent.schoolId,
    };

    return (
        <div className="container py-10">
            <ParentForm parent={parentData} />
        </div>
    );
} 
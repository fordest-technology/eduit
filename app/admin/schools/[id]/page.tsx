import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SchoolDetails } from "../../_components/school-details";

interface SchoolPageProps {
    params: {
        id: string;
    };
}

export default async function SchoolPage({ params }: SchoolPageProps) {
    const session = await getSession();

    if (!session || session.role !== "super_admin") {
        redirect("/auth/signin");
    }

    return <SchoolDetails schoolId={params.id} />;
} 
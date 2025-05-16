import { Metadata } from "next";
import { ResultsConfigurationFormContainer } from "./_components/results-configuration-form-container";
import { ResultsManagementContainer } from "./_components/results-management-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/app/components/dashboard-header";

export const metadata: Metadata = {
    title: "Results Management",
    description: "Configure and manage student results",
};

export default async function ResultsPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (!session.schoolId) {
        redirect("/dashboard");
    }

    return (
        <div className="space-y-6">
            <DashboardHeader
                heading="Results Management"
                text="Configure result settings and manage student results"
                showBanner={true}
            />

            <div className="container mx-auto">
                <Tabs defaultValue="configuration" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="configuration">Configuration</TabsTrigger>
                        <TabsTrigger value="results">Results</TabsTrigger>
                    </TabsList>

                    <TabsContent value="configuration" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Result Configuration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResultsConfigurationFormContainer schoolId={session.schoolId} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="results" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Results Management</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResultsManagementContainer schoolId={session.schoolId} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
} 
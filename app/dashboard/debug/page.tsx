"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ExternalLink, Mail, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmailDebugFile {
    name: string;
    emailId: string;
    timestamp: number;
    created: string;
    url: string;
}

interface ApiCall {
    requestId: string;
    timestamp: string;
    email: string;
    role: string;
    success: boolean;
    error?: string;
    duration: number;
    steps: { time: number; msg: string; details?: any; error?: string }[];
}

export default function DashboardDebugPage() {
    const [loading, setLoading] = useState(true);
    const [emailDebugFiles, setEmailDebugFiles] = useState<EmailDebugFile[]>([]);
    const [apiCalls, setApiCalls] = useState<ApiCall[]>([]);
    const [emailConfig, setEmailConfig] = useState<Record<string, string>>({});
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const [emailPreviewUrl, setEmailPreviewUrl] = useState<string | null>(null);
    const router = useRouter();

    const loadEmailDebugData = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/debug/emails");
            if (!response.ok) throw new Error("Failed to load email debug data");
            const data = await response.json();
            setEmailDebugFiles(data.files || []);
            setEmailConfig(data.emailConfig || {});
        } catch (error) {
            console.error("Error loading email debug data:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadApiCallsData = async () => {
        try {
            const response = await fetch("/api/send-credentials");
            if (!response.ok) throw new Error("Failed to load API calls data");
            const data = await response.json();
            setApiCalls(data.apiCalls || []);
        } catch (error) {
            console.error("Error loading API calls data:", error);
        }
    };

    useEffect(() => {
        loadEmailDebugData();
        loadApiCallsData();
    }, []);

    const handleViewEmail = (emailFile: EmailDebugFile) => {
        setSelectedEmail(emailFile.name);
        setEmailPreviewUrl(emailFile.url);
        // Open in new tab as well
        window.open(emailFile.url, "_blank");
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <div className="container py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Email Debugging</h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            loadEmailDebugData();
                            loadApiCallsData();
                        }}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.back()}
                    >
                        Back
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="emails">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="emails">Email Files</TabsTrigger>
                    <TabsTrigger value="api">API Calls</TabsTrigger>
                </TabsList>

                <TabsContent value="emails" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Debug Email Files</CardTitle>
                            <CardDescription>
                                These are saved email templates for debugging. Emails are saved in the .email-debug directory.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center p-6">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : emailDebugFiles.length === 0 ? (
                                <div className="text-center p-6 text-muted-foreground">
                                    <Mail className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>No debug email files found.</p>
                                    <p className="text-sm mt-2">
                                        Try adding a teacher to generate an email.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {emailDebugFiles.map((file) => (
                                        <div
                                            key={file.name}
                                            className="border rounded-md p-4 flex justify-between hover:bg-muted/50"
                                        >
                                            <div>
                                                <div className="font-medium">{file.emailId}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatDate(file.created)}
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleViewEmail(file)}
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                View
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex-col items-start">
                            <div className="text-sm font-medium mb-2">Email Configuration</div>
                            <div className="grid grid-cols-2 gap-2 w-full text-sm">
                                {Object.entries(emailConfig).map(([key, value]) => (
                                    <div key={key} className="flex justify-between border-b pb-1">
                                        <span className="text-muted-foreground">{key}:</span>
                                        <span
                                            className={value === 'not-configured' ? 'text-red-500' : 'text-green-500'}
                                        >
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="api" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent API Calls</CardTitle>
                            <CardDescription>
                                Track credential email API calls and troubleshoot issues
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {apiCalls.length === 0 ? (
                                <div className="text-center p-6 text-muted-foreground">
                                    <p>No API calls recorded yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {apiCalls.map((call) => (
                                        <div
                                            key={call.requestId}
                                            className={`border rounded-md overflow-hidden ${call.success ? "border-green-200" : "border-red-200"
                                                }`}
                                        >
                                            <div
                                                className={`px-4 py-2 font-medium flex justify-between items-center ${call.success ? "bg-green-50" : "bg-red-50"
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <span
                                                        className={`h-2 w-2 rounded-full mr-2 ${call.success ? "bg-green-500" : "bg-red-500"
                                                            }`}
                                                    />
                                                    <span>{call.requestId}</span>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {formatDate(call.timestamp)} • {formatDuration(call.duration)}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="grid grid-cols-2 gap-2 mb-4">
                                                    <div>
                                                        <span className="text-sm text-muted-foreground block">Email:</span>
                                                        <span>{call.email}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-muted-foreground block">Role:</span>
                                                        <span>{call.role}</span>
                                                    </div>
                                                </div>

                                                {call.error && (
                                                    <div className="bg-red-50 p-3 rounded-md mb-4 text-red-800 text-sm">
                                                        {call.error}
                                                    </div>
                                                )}

                                                <div className="text-sm font-medium mb-2">Steps:</div>
                                                <div className="space-y-1 text-sm">
                                                    {call.steps?.map((step, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="flex items-start border-l-2 pl-3 py-1 border-gray-200"
                                                        >
                                                            <span className="text-muted-foreground w-14">
                                                                {formatDuration(step.time)}
                                                            </span>
                                                            <span
                                                                className={step.error ? "text-red-600" : ""}
                                                            >
                                                                {step.msg}
                                                                {step.error && `: ${step.error}`}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 
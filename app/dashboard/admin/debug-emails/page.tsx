"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Mail, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface EmailDebug {
    id: string;
    filename: string;
    createdAt: string;
    size: number;
}

export default function DebugEmailsPage() {
    const [emails, setEmails] = useState<EmailDebug[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
    const [emailContent, setEmailContent] = useState<string | null>(null);
    const [emailContentLoading, setEmailContentLoading] = useState(false);

    useEffect(() => {
        fetchEmails();
    }, []);

    const fetchEmails = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/debug-emails");
            if (!response.ok) {
                throw new Error("Failed to fetch emails");
            }
            const data = await response.json();
            setEmails(data.emails || []);
        } catch (error) {
            console.error("Error fetching emails:", error);
            toast.error("Failed to load debug emails");
        } finally {
            setLoading(false);
        }
    };

    const viewEmail = async (filename: string) => {
        setSelectedEmail(filename);
        setEmailContentLoading(true);
        setEmailContent(null);

        try {
            const response = await fetch("/api/debug-emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ filename }),
            });

            if (!response.ok) {
                throw new Error("Failed to fetch email content");
            }

            const data = await response.json();
            setEmailContent(data.content);
        } catch (error) {
            console.error("Error fetching email content:", error);
            toast.error("Failed to load email content");
        } finally {
            setEmailContentLoading(false);
        }
    };

    return (
        <div className="container p-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Mail className="mr-2 h-5 w-5" />
                        Debug Emails Viewer
                    </CardTitle>
                    <CardDescription>
                        View debug emails captured during development. This feature is only available in development mode.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {process.env.NODE_ENV !== "development" && (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                            <p className="text-yellow-700">
                                This feature is only available in development mode. In production, emails are sent directly to recipients.
                            </p>
                        </div>
                    )}

                    <div className="mb-4 flex justify-between">
                        <Button onClick={fetchEmails} variant="outline">
                            Refresh
                        </Button>
                    </div>

                    {loading ? (
                        <div className="py-8 text-center">Loading emails...</div>
                    ) : emails.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            No debug emails found. Create a parent or reset a password to generate emails.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {emails.map((email) => (
                                    <TableRow key={email.id}>
                                        <TableCell>
                                            {format(new Date(email.createdAt), "MMM d, yyyy HH:mm:ss")}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{email.id}</TableCell>
                                        <TableCell>{Math.round(email.size / 1024)} KB</TableCell>
                                        <TableCell>
                                            <Sheet>
                                                <SheetTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => viewEmail(email.filename)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </Button>
                                                </SheetTrigger>
                                                <SheetContent className="w-[90vw] sm:max-w-[900px]">
                                                    <SheetHeader>
                                                        <SheetTitle>Email Preview</SheetTitle>
                                                    </SheetHeader>
                                                    <div className="mt-4">
                                                        {emailContentLoading ? (
                                                            <div className="py-8 text-center">Loading email content...</div>
                                                        ) : emailContent ? (
                                                            <div className="border rounded-md p-1">
                                                                <div className="bg-white rounded-sm p-2 overflow-auto max-h-[80vh]">
                                                                    <iframe
                                                                        srcDoc={emailContent}
                                                                        className="w-full h-[70vh] border-0"
                                                                        title="Email Preview"
                                                                    />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="py-8 text-center text-muted-foreground">
                                                                Select an email to preview
                                                            </div>
                                                        )}
                                                    </div>
                                                </SheetContent>
                                            </Sheet>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 
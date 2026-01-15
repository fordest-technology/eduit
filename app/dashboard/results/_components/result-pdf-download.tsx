"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Download, FileText, Loader2, Eye } from "lucide-react";
import { Student, Period, Session } from "../types";

interface ResultPDFDownloadProps {
  schoolId: string;
  students: Student[];
  periods: Period[];
  sessions: Session[];
  selectedClassId?: string | null;
}

export function ResultPDFDownload({
  schoolId,
  students,
  periods,
  sessions,
  selectedClassId,
}: ResultPDFDownloadProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  const handleGenerate = async (preview: boolean = false) => {
    if (!selectedStudent || !selectedPeriod || !selectedSession) {
      toast({
        title: "Missing Selection",
        description: "Please select student, period, and session",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setPreviewMode(preview);

    try {
      // Fetch full result data for the student
      const response = await fetch(
        `/api/schools/${schoolId}/results/student/${selectedStudent}?periodId=${selectedPeriod}&sessionId=${selectedSession}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const data = await response.json();
      setResultData(data);

      if (!preview) {
        // Generate PDF download
        await downloadPDF(data);
      }
    } catch (error) {
      console.error("Error generating result:", error);
      toast({
        title: "Error",
        description: "Failed to generate result. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = async (data: any) => {
    try {
      const response = await fetch(`/api/schools/${schoolId}/results/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent,
          periodId: selectedPeriod,
          sessionId: selectedSession,
          resultData: data,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `result-${data.student?.name || 'student'}-${selectedPeriod}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Result PDF downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectedStudentData = students.find((s) => s.id === selectedStudent);
  const selectedPeriodData = periods.find((p) => p.id === selectedPeriod);
  const selectedSessionData = sessions.find((s) => s.id === selectedSession);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download Result PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-orange-500" />
            Download Student Result
          </DialogTitle>
          <DialogDescription>
            Select a student and term to download their result as PDF
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Session Selection */}
          <div className="space-y-2">
            <Label>Academic Session</Label>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Selection */}
          <div className="space-y-2">
            <Label>Term/Period</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Student Selection */}
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                    {student.rollNumber && ` (${student.rollNumber})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview Section */}
          {previewMode && resultData && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
              <h4 className="font-semibold mb-2">Preview</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Student:</strong> {resultData.student?.name}</p>
                <p><strong>Class:</strong> {resultData.class?.name}</p>
                <p><strong>Term:</strong> {selectedPeriodData?.name}</p>
                <p><strong>Session:</strong> {selectedSessionData?.name}</p>
                <div className="mt-3">
                  <p className="font-medium mb-1">Subjects:</p>
                  {resultData.results?.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {resultData.results.map((result: any, index: number) => (
                        <li key={index}>
                          {result.subject?.name}: {result.total} ({result.grade})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No results found</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleGenerate(true)}
            disabled={generating || !selectedStudent || !selectedPeriod || !selectedSession}
          >
            {generating && previewMode ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Preview
          </Button>
          <Button
            onClick={() => handleGenerate(false)}
            disabled={generating || !selectedStudent || !selectedPeriod || !selectedSession}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {generating && !previewMode ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

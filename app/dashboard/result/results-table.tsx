"use client"

import { useState } from "react"
import type { Result } from "./types"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { approveResult, rejectResult, generateReport } from "./actions"
import ResultReport from "./components/result-report"
import { useToast } from "@/hooks/use-toast"

interface ResultsTableProps {
  results: Result[]
}

export default function ResultsTable({ results }: ResultsTableProps) {
  const { toast } = useToast()
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)
  const [reportContent, setReportContent] = useState<string | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleViewReport = async (result: Result) => {
    setSelectedResult(result)
    setIsLoading(true)

    try {
      const response = await generateReport(result.id)
      setReportContent(response.content)
      setIsReportOpen(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setIsLoading(true)
    try {
      await approveResult(id)
      toast({
        title: "Success",
        description: "Result approved successfully",
      })
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve result",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async (id: string) => {
    setIsLoading(true)
    try {
      await rejectResult(id)
      toast({
        title: "Success",
        description: "Result rejected successfully",
      })
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject result",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-500">Rejected</Badge>
      default:
        return <Badge className="bg-yellow-500">Pending</Badge>
    }
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>School Level</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4">
                No results found
              </TableCell>
            </TableRow>
          ) : (
            results.map((result) => (
              <TableRow key={result.id}>
                <TableCell className="font-medium">{result.title}</TableCell>
                <TableCell>{getStatusBadge(result.status)}</TableCell>
                <TableCell>{result.schoolLevel || "N/A"}</TableCell>
                <TableCell>{result.score !== undefined ? result.score : "N/A"}</TableCell>
                <TableCell>{new Date(result.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewReport(result)} disabled={isLoading}>
                      View Report
                    </Button>
                    {result.status === "pending" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleApprove(result.id)}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(result.id)}
                          disabled={isLoading}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Report for {selectedResult?.title}</DialogTitle>
          </DialogHeader>
          {reportContent && <ResultReport content={reportContent} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}


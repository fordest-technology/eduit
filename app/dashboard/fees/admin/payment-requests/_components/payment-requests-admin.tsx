"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { ExternalLink, ChevronDown, Search, X, Check, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PaymentRequestStudent {
  id: string
  user: {
    id: string
    name: string
  }
  classes: Array<{
    class: {
      id: string
      name: string
    }
  }>
}

interface PaymentRequest {
  id: string
  amount: number
  status: string
  createdAt: string | Date
  updatedAt: string | Date
  receiptUrl: string | null
  notes: string | null
  reviewedAt: string | Date | null
  reviewNotes: string | null
  student: PaymentRequestStudent
  billAssignment: {
    id: string
    bill: {
      id: string
      name: string
      description: string | null
      amount: number
      dueDate: string | Date
      account: {
        id: string
        name: string
        bankName: string
        accountNo: string
      }
    }
  }
  requestedBy: {
    id: string
    name: string
  }
  reviewedBy: {
    id: string
    name: string
  } | null
}

interface PaymentRequestsAdminProps {
  paymentRequests: PaymentRequest[]
}

export function PaymentRequestsAdmin({ paymentRequests: initialRequests }: PaymentRequestsAdminProps) {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>(initialRequests)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Format dates
  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "N/A"
    return format(new Date(dateString), "PPP")
  }

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string; icon: React.ReactNode }> = {
      PENDING: {
        label: "Pending",
        variant: "outline",
        icon: <Clock className="h-3 w-3 mr-1" />,
      },
      APPROVED: {
        label: "Approved",
        variant: "default",
        icon: <Check className="h-3 w-3 mr-1" />,
      },
      REJECTED: {
        label: "Rejected",
        variant: "destructive",
        icon: <X className="h-3 w-3 mr-1" />,
      },
    }

    const { label, variant, icon } = statusMap[status] || {
      label: status,
      variant: "secondary",
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
    }

    return (
      <Badge variant={variant as any} className="flex items-center">
        {icon}
        {label}
      </Badge>
    )
  }

  // Process payment request
  const processPaymentRequest = async (requestId: string, action: "approve" | "reject") => {
    if (!selectedRequest) return

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/payment-requests/${requestId}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          notes: reviewNotes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to process payment request")
      }

      // Update the local state with the processed payment request
      const updatedRequest = await response.json()

      setPaymentRequests((prev) => prev.map((req) => (req.id === requestId ? updatedRequest : req)))

      toast.success(`Payment request ${action === "approve" ? "approved" : "rejected"} successfully`)

      // Close dialogs
      setIsApproveDialogOpen(false)
      setIsRejectDialogOpen(false)
      setReviewNotes("")
    } catch (error) {
      console.error(`Error ${action}ing payment request:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${action} payment request`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle approve button click
  const handleApproveClick = (request: PaymentRequest) => {
    setSelectedRequest(request)
    setReviewNotes("")
    setIsApproveDialogOpen(true)
  }

  // Handle reject button click
  const handleRejectClick = (request: PaymentRequest) => {
    setSelectedRequest(request)
    setReviewNotes("")
    setIsRejectDialogOpen(true)
  }

  // Filter and search data
  const filteredPaymentRequests = paymentRequests.filter((request) => {
    // Apply tab filter
    if (activeTab === "pending" && request.status !== "PENDING") {
      return false
    }
    if (activeTab === "approved" && request.status !== "APPROVED") {
      return false
    }
    if (activeTab === "rejected" && request.status !== "REJECTED") {
      return false
    }

    // Apply status filter
    if (statusFilter !== "all" && request.status !== statusFilter) {
      return false
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        request.billAssignment.bill.name.toLowerCase().includes(searchLower) ||
        request.billAssignment.bill.description?.toLowerCase().includes(searchLower) ||
        false ||
        request.student.user.name.toLowerCase().includes(searchLower) ||
        request.requestedBy.name.toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  // Get counts for the tabs
  const pendingCount = paymentRequests.filter((request) => request.status === "PENDING").length
  const approvedCount = paymentRequests.filter((request) => request.status === "APPROVED").length
  const rejectedCount = paymentRequests.filter((request) => request.status === "REJECTED").length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Requests</CardTitle>
          <CardDescription>Review and process payment requests from parents</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
              <TabsList>
                <TabsTrigger value="all" className="relative">
                  All
                  <Badge className="ml-2" variant="secondary">
                    {paymentRequests.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="pending" className="relative">
                  Pending
                  <Badge className="ml-2" variant="outline">
                    {pendingCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="approved" className="relative">
                  Approved
                  <Badge className="ml-2" variant="default">
                    {approvedCount}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="rejected" className="relative">
                  Rejected
                  <Badge className="ml-2" variant="destructive">
                    {rejectedCount}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search requests..."
                  className="pl-8 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1.5 h-7 w-7"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <TabsContent value="all" className="m-0">
              {renderPaymentRequestsTable()}
            </TabsContent>
            <TabsContent value="pending" className="m-0">
              {renderPaymentRequestsTable()}
            </TabsContent>
            <TabsContent value="approved" className="m-0">
              {renderPaymentRequestsTable()}
            </TabsContent>
            <TabsContent value="rejected" className="m-0">
              {renderPaymentRequestsTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Approve Sheet */}
      <Sheet open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto" side="right">
          <SheetHeader className="mb-6">
            <SheetTitle>Approve Payment Request</SheetTitle>
            <SheetDescription>Are you sure you want to approve this payment request?</SheetDescription>
          </SheetHeader>
          <div className="bg-muted/50 p-3 rounded-md my-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-muted-foreground">Student:</div>
              <div>{selectedRequest?.student.user.name}</div>
              <div className="text-muted-foreground">Bill:</div>
              <div>{selectedRequest?.billAssignment.bill.name}</div>
              <div className="text-muted-foreground">Amount:</div>
              <div>{selectedRequest && formatCurrency(selectedRequest.amount)}</div>
            </div>
          </div>
          <div className="space-y-2 py-4">
            <label htmlFor="approve-notes" className="text-sm font-medium">
              Notes (Optional)
            </label>
            <Textarea
              id="approve-notes"
              placeholder="Add any notes about this approval"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
            />
          </div>
          <SheetFooter className="mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => selectedRequest && processPaymentRequest(selectedRequest.id, "approve")}
              disabled={isProcessing}
              className="sm:w-32"
            >
              {isProcessing ? "Processing..." : "Approve"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Reject Sheet */}
      <Sheet open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto" side="right">
          <SheetHeader className="mb-6">
            <SheetTitle>Reject Payment Request</SheetTitle>
            <SheetDescription>Please provide a reason for rejecting this payment request.</SheetDescription>
          </SheetHeader>
          <div className="bg-muted/50 p-3 rounded-md my-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-muted-foreground">Student:</div>
              <div>{selectedRequest?.student.user.name}</div>
              <div className="text-muted-foreground">Bill:</div>
              <div>{selectedRequest?.billAssignment.bill.name}</div>
              <div className="text-muted-foreground">Amount:</div>
              <div>{selectedRequest && formatCurrency(selectedRequest.amount)}</div>
            </div>
          </div>
          <div className="space-y-2 py-4">
            <label htmlFor="reject-notes" className="text-sm font-medium">
              Rejection Reason
            </label>
            <Textarea
              id="reject-notes"
              placeholder="Explain why this payment request is being rejected"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>
          <SheetFooter className="mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => selectedRequest && processPaymentRequest(selectedRequest.id, "reject")}
              disabled={isProcessing || !reviewNotes.trim()}
              className="sm:w-32"
            >
              {isProcessing ? "Processing..." : "Reject"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )

  function renderPaymentRequestsTable() {
    if (filteredPaymentRequests.length === 0) {
      return (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No payment requests found</p>
        </div>
      )
    }

    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Bill</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPaymentRequests.map((request) => (
              <Collapsible
                key={request.id}
                open={expandedId === request.id}
                onOpenChange={() => setExpandedId(expandedId === request.id ? null : request.id)}
                className="w-full"
              >
                <TableRow className="group hover:bg-muted/50">
                  <TableCell className="font-medium">{request.student.user.name}</TableCell>
                  <TableCell>{request.billAssignment.bill.name}</TableCell>
                  <TableCell>{formatCurrency(request.amount)}</TableCell>
                  <TableCell>{formatDate(request.createdAt)}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${expandedId === request.id ? "rotate-180" : ""
                            }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </TableCell>
                </TableRow>
                <CollapsibleContent>
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell colSpan={6} className="p-0">
                      <div className="bg-muted/50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Payment Details</h4>
                            <div className="grid grid-cols-2 gap-1 text-sm">
                              <div className="text-muted-foreground">Student</div>
                              <div>{request.student.user.name}</div>

                              <div className="text-muted-foreground">Class</div>
                              <div>
                                {request.student.classes.length > 0
                                  ? request.student.classes.map((c) => c.class.name).join(", ")
                                  : "N/A"}
                              </div>

                              <div className="text-muted-foreground">Bill</div>
                              <div>{request.billAssignment.bill.name}</div>

                              <div className="text-muted-foreground">Requested By</div>
                              <div>{request.requestedBy.name}</div>

                              <div className="text-muted-foreground">Total Bill Amount</div>
                              <div>{formatCurrency(request.billAssignment.bill.amount)}</div>

                              <div className="text-muted-foreground">Payment Amount</div>
                              <div className="font-medium">{formatCurrency(request.amount)}</div>

                              <div className="text-muted-foreground">Due Date</div>
                              <div>{formatDate(request.billAssignment.bill.dueDate)}</div>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium">Status Information</h4>
                            <div className="grid grid-cols-2 gap-1 text-sm">
                              <div className="text-muted-foreground">Status</div>
                              <div>{getStatusBadge(request.status)}</div>

                              <div className="text-muted-foreground">Submitted</div>
                              <div>{formatDate(request.createdAt)}</div>

                              <div className="text-muted-foreground">Reviewed</div>
                              <div>{formatDate(request.reviewedAt)}</div>

                              <div className="text-muted-foreground">Reviewed By</div>
                              <div>{request.reviewedBy?.name || "N/A"}</div>

                              <div className="text-muted-foreground">Account</div>
                              <div>{request.billAssignment.bill.account.name}</div>

                              <div className="text-muted-foreground">Bank</div>
                              <div>{request.billAssignment.bill.account.bankName}</div>

                              <div className="text-muted-foreground">Account Number</div>
                              <div>{request.billAssignment.bill.account.accountNo}</div>
                            </div>
                          </div>
                        </div>

                        {(request.notes || request.reviewNotes) && (
                          <>
                            <Separator className="my-4" />
                            <div className="space-y-3">
                              {request.notes && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Parent Notes</h4>
                                  <p className="text-sm">{request.notes}</p>
                                </div>
                              )}
                              {request.reviewNotes && (
                                <div>
                                  <h4 className="text-sm font-medium mb-1">Review Notes</h4>
                                  <p className="text-sm">{request.reviewNotes}</p>
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        <div className="flex flex-wrap justify-end gap-2 mt-4">
                          {request.receiptUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(request.receiptUrl!, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Receipt
                            </Button>
                          )}

                          {request.status === "PENDING" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => handleRejectClick(request)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                              <Button variant="default" size="sm" onClick={() => handleApproveClick(request)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }
}


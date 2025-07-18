"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useState } from "react"

interface PaymentAccountBannerProps {
    name: string
    bankName: string
    accountNo: string
}

export function PaymentAccountBanner({ name, bankName, accountNo }: PaymentAccountBannerProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(accountNo)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }

    return (
        <Alert className="bg-blue-50 border-blue-200 text-blue-900 mb-4">
            <AlertTitle>Active Payment Account</AlertTitle>
            <AlertDescription>
                <div className="flex flex-col gap-1">
                    <span><b>Account Name:</b> {name}</span>
                    <span><b>Bank Name:</b> {bankName}</span>
                    <span className="flex items-center gap-2">
                        <b>Account Number:</b> {accountNo}
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={handleCopy}
                            className="h-6 w-6"
                            aria-label="Copy account number"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        {copied && <span className="text-xs text-green-600 ml-2">Copied!</span>}
                    </span>
                </div>
            </AlertDescription>
        </Alert>
    )
} 
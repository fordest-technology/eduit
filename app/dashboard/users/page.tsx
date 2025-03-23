"use client"

import { useEffect, useState } from "react"
import { UsersTable } from "./users-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { AddUserDialog } from "@/components/add-user-dialog"
import { Role } from "@prisma/client"

export default function UsersPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Users</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <UsersTable />

      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        initialRole={selectedRole}
      />
    </div>
  )
}


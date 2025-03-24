export type Result = {
  id: string
  title: string
  description: string
  status: "pending" | "approved" | "rejected"
  createdAt: Date
  updatedAt: Date
  schoolLevel?: string
  score?: number
  reportId?: string
}

export type Report = {
  id: string
  content: string
  resultId: string
  createdAt: Date
  updatedAt: Date
}


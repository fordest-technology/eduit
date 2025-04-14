export interface Student {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
  classes: Array<{
    classId: string;
    className: string;
    section: string | null;
  }>;
}

export interface BillWithRelations {
  id: string;
  schoolId: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    billId: string;
    name: string;
    amount: number;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    bill: {
      id: string;
      schoolId: string;
      accountId: string;
      createdAt: Date;
      updatedAt: Date;
    };
  }[];
  account: {
    id: string;
    name: string;
    accountNo: string;
    bankName: string;
    branchCode: string | null;
    description: string | null;
    isActive: boolean;
    schoolId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  assignments: {
    id: string;
    billId: string;
    targetType: "CLASS" | "STUDENT";
    targetId: string;
    dueDate: Date;
    status: "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE";
    createdAt: Date;
    updatedAt: Date;
    studentPayments: {
      id: string;
      billAssignmentId: string;
      studentId: string;
      amountPaid: number;
      createdAt: Date;
      updatedAt: Date;
      student: {
        id: string;
        userId: string;
        user: {
          name: string;
          email: string;
        };
      };
    }[];
  }[];
}

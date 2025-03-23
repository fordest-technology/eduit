import { Prisma } from "@prisma/client";

export type ExtendedResult = Prisma.ResultGetPayload<{
  include: {
    student: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            role: true;
            schoolId: true;
            profileImage: true;
          };
        };
        classes: {
          include: {
            class: {
              select: {
                id: true;
                name: true;
                section: true;
              };
            };
          };
        };
      };
    };
    subject: {
      select: {
        id: true;
        name: true;
        code: true;
      };
    };
  };
}> & {
  position?: number | null;
  section?: string | null;
  id: string;
  marks: number;
  grade: string | null;
  totalMarks: number;
  examType: string;
  isApproved: boolean;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

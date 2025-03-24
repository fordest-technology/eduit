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

export interface Parent {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  phone?: string | null;
  parent?: {
    id: string;
    phone?: string | null;
    children: Array<{
      id: string;
      student: {
        id: string;
        user: {
          name: string;
        };
        classes: Array<{
          class: {
            name: string;
          };
        }>;
      };
      relation?: string | null;
    }>;
  };
}

export interface ParentFormData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profileImage?: string | null;
  schoolId?: string | null;
}

export interface StudentData {
  id: string;
  name: string;
  class: string;
}

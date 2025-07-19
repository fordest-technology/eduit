export interface Parent {
  id: string;
  name: string;
  email: string;
  profileImage?: string | null;
  phone?: string | null;
  alternatePhone?: string | null;
  occupation?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  alternatePhone?: string | null;
  occupation?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  profileImage?: string | null;
  schoolId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StudentData {
  id: string;
  name: string;
  class: string;
}

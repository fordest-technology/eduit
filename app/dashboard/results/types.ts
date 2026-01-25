export interface Student {
  id: string;
  name: string;
  rollNumber?: string; // Optional, as it might not always be present
  currentClass?: {
    id: string;
    name: string;
    section?: string;
    status?: "ACTIVE" | "INACTIVE" | "PENDING"; // Optional status
  } | null; // currentClass can be null
}

export interface Subject {
  id: string;
  name: string;
}

export interface Period {
  id: string;
  name: string;
  weight: number;
  status?: "ACTIVE" | "INACTIVE" | "GRADING" | "PUBLISHED" | "CLOSED";
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

export interface Session {
  id: string;
  name: string;
}

export interface AssessmentComponent {
  id: string;
  name: string;
  key: string;
  maxScore: number;
  isComposite?: boolean;
  composedOf?: string[]; // Array of component keys that make up this composite
}

export interface GradeScale {
  id: string;
  minScore: number;
  maxScore: number;
  grade: string;
  remark: string;
}

export interface ComponentScore {
  id: string;
  score: number;
  componentId?: string;
  componentKey: string;
  resultId: string;
  component?: AssessmentComponent;
}

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  periodId: string;
  sessionId: string;
  classId?: string;
  schoolId: string;
  total?: number;
  grade?: string;
  remark?: string;
  cumulativeAverage?: number;
  componentScores: ComponentScore[];
  affectiveTraits?: Record<string, string>;
  psychomotorSkills?: Record<string, string>;
  customFields?: Record<string, string>;
  teacherComment?: string;
  adminComment?: string;
  student?: Student;
  subject?: Subject;
  period?: Period;
}

export interface ResultConfiguration {
  id: string;
  schoolId: string;
  academicYear: string;
  periods: Period[];
  assessmentComponents: AssessmentComponent[];
  gradingScale: GradeScale[];
  cumulativeEnabled: boolean;
  cumulativeMethod: string;
  showCumulativePerTerm: boolean;
}

export interface BatchResultEntry {
  studentId: string;
  subjectId: string;
  periodId: string;
  sessionId: string;
  classId?: string;
  componentScores: {
    componentId: string;
    score: number;
  }[];
}

export interface ResultMatrix {
  [studentId: string]: {
    [subjectId: string]: {
      [componentKey: string]: number;
    };
  };
}

export interface CompositeComponentMap {
  [key: string]: {
    component: AssessmentComponent;
    sources: string[];
  };
}

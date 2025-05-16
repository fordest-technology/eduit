export interface Student {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
}

export interface Period {
  id: string;
  name: string;
  weight: number;
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
  componentId: string;
  resultId: string;
  component: AssessmentComponent;
}

export interface Result {
  id: string;
  studentId: string;
  subjectId: string;
  periodId: string;
  sessionId: string;
  total: number;
  grade: string;
  remark: string;
  cumulativeAverage?: number;
  componentScores: ComponentScore[];
  affectiveTraits?: Record<string, string>;
  psychomotorSkills?: Record<string, string>;
  customFields?: Record<string, string>;
  teacherComment?: string;
  adminComment?: string;
  student: Student;
  subject: Subject;
  period: Period;
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

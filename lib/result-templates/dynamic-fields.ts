/**
 * Dynamic Field Definitions for Result Templates
 * 
 * These define the available dynamic fields that can be bound to template elements.
 * Each field has a key, label, category, and description.
 */

export interface DynamicFieldDefinition {
  key: string;
  label: string;
  category: "student" | "school" | "result" | "period" | "attendance" | "computed" | "custom";
  description: string;
  example: string;
}

export const dynamicFields: DynamicFieldDefinition[] = [
  // Student Information
  {
    key: "student_name",
    label: "Student Name",
    category: "student",
    description: "Full name of the student",
    example: "Ifunanya Kelemade"
  },
  {
    key: "admission_number",
    label: "Admission Number",
    category: "student",
    description: "Unique student admission/registration number",
    example: "STU/2020/1004"
  },
  {
    key: "gender",
    label: "Gender",
    category: "student",
    description: "Student's gender",
    example: "Female"
  },
  {
    key: "date_of_birth",
    label: "Date of Birth",
    category: "student",
    description: "Student's birth date",
    example: "15th March, 2012"
  },
  {
    key: "student_photo",
    label: "Student Photo",
    category: "student",
    description: "Passport photograph of the student",
    example: "[Photo]"
  },
  {
    key: "age",
    label: "Age",
    category: "student",
    description: "Student's current age",
    example: "12"
  },
  
  // School Information
  {
    key: "school_name",
    label: "School Name",
    category: "school",
    description: "Official name of the school",
    example: "Step to Success Demo School"
  },
  {
    key: "school_address",
    label: "School Address",
    category: "school",
    description: "Physical address of the school",
    example: "5 Blessing Okoh Way, Benin City"
  },
  {
    key: "school_motto",
    label: "School Motto",
    category: "school",
    description: "School's motto or tagline",
    example: "Excellence Personified"
  },
  {
    key: "school_logo",
    label: "School Logo",
    category: "school",
    description: "School's official logo/emblem",
    example: "[Logo]"
  },
  {
    key: "school_phone",
    label: "School Phone",
    category: "school",
    description: "School's contact phone number",
    example: "08012345678"
  },
  {
    key: "school_email",
    label: "School Email",
    category: "school",
    description: "School's official email address",
    example: "info@school.edu.ng"
  },
  {
    key: "school_website",
    label: "School Website",
    category: "school",
    description: "School's website URL",
    example: "www.school.edu.ng"
  },
  {
    key: "school_stamp",
    label: "School Stamp",
    category: "school",
    description: "Official school stamp/seal",
    example: "[Stamp]"
  },
  
  // Period/Session Information
  {
    key: "academic_session",
    label: "Academic Session",
    category: "period",
    description: "Current academic year/session",
    example: "2024/2025"
  },
  {
    key: "term_name",
    label: "Term Name",
    category: "period",
    description: "Current term (First, Second, Third)",
    example: "First Term"
  },
  {
    key: "class_name",
    label: "Class Name",
    category: "period",
    description: "Student's current class",
    example: "Primary 4"
  },
  {
    key: "class_section",
    label: "Class Section/Arm",
    category: "period",
    description: "Class section or arm (e.g., A, B, Gold)",
    example: "A"
  },
  {
    key: "class_teacher",
    label: "Class Teacher",
    category: "period",
    description: "Name of the class teacher",
    example: "Mrs. Johnson"
  },
  {
    key: "students_in_class",
    label: "Number in Class",
    category: "period",
    description: "Total number of students in the class",
    example: "35"
  },
  {
    key: "vacation_date",
    label: "Vacation Date",
    category: "period",
    description: "Date when term vacation begins",
    example: "15th December, 2024"
  },
  {
    key: "resumption_date",
    label: "Resumption Date",
    category: "period",
    description: "Date when next term begins",
    example: "10th January, 2025"
  },
  {
    key: "next_term_date",
    label: "Next Term Date",
    category: "period",
    description: "Expected date for next term",
    example: "10th Jan, 2025"
  },
  
  // Result/Score Information
  {
    key: "total_score",
    label: "Total Score",
    category: "result",
    description: "Sum of all subject scores",
    example: "752"
  },
  {
    key: "total_obtainable",
    label: "Total Obtainable",
    category: "result",
    description: "Maximum possible total score",
    example: "1000"
  },
  {
    key: "average_score",
    label: "Average Score",
    category: "result",
    description: "Average of all subject scores",
    example: "75.2%"
  },
  {
    key: "overall_grade",
    label: "Overall Grade",
    category: "result",
    description: "Final grade based on average",
    example: "A"
  },
  {
    key: "position",
    label: "Class Position",
    category: "result",
    description: "Student's rank/position in class",
    example: "2nd"
  },
  {
    key: "result_status",
    label: "Result Status",
    category: "result",
    description: "Pass/Fail/Promoted status",
    example: "Passed"
  },
  {
    key: "teacher_comment",
    label: "Teacher's Comment",
    category: "result",
    description: "Class teacher's remark",
    example: "A very promising child"
  },
  {
    key: "admin_comment",
    label: "Principal's Comment",
    category: "result",
    description: "Principal/Head Master's remark",
    example: "Excellent performance"
  },
  {
    key: "grading_scale",
    label: "Grading Scale",
    category: "result",
    description: "School's grading scale/legend",
    example: "A: 70-100, B: 60-69..."
  },
  
  // Attendance
  {
    key: "days_present",
    label: "Days Present",
    category: "attendance",
    description: "Number of days student was present",
    example: "85"
  },
  {
    key: "days_absent",
    label: "Days Absent",
    category: "attendance",
    description: "Number of days student was absent",
    example: "17"
  },
  {
    key: "total_days",
    label: "Total Days in Term",
    category: "attendance",
    description: "Total number of school days in term",
    example: "102"
  },
  {
    key: "attendance_percentage",
    label: "Attendance Percentage",
    category: "attendance",
    description: "Percentage of attendance",
    example: "83%"
  },
  
  // Computed/Dynamic Fields (Filled at generation time)
  {
    key: "subjects_table",
    label: "Subjects Table",
    category: "computed",
    description: "Dynamic table of subject scores",
    example: "[Table]"
  },
  {
    key: "affective_traits",
    label: "Affective Traits",
    category: "computed",
    description: "Behavioral/character assessment ratings",
    example: "[Traits Table]"
  },
  {
    key: "psychomotor_skills",
    label: "Psychomotor Skills",
    category: "computed",
    description: "Motor skills assessment ratings",
    example: "[Skills Table]"
  },
  {
    key: "cumulative_average",
    label: "Cumulative Average",
    category: "computed",
    description: "Average across multiple terms",
    example: "72.5%"
  },
];

/**
 * Get fields by category
 */
export function getFieldsByCategory(category: DynamicFieldDefinition["category"]) {
  return dynamicFields.filter(f => f.category === category);
}

/**
 * Get field definition by key
 */
export function getFieldByKey(key: string): DynamicFieldDefinition | undefined {
  return dynamicFields.find(f => f.key === key);
}

/**
 * Grouped fields for UI display
 */
export const groupedFields = {
  student: getFieldsByCategory("student"),
  school: getFieldsByCategory("school"),
  period: getFieldsByCategory("period"),
  result: getFieldsByCategory("result"),
  attendance: getFieldsByCategory("attendance"),
  computed: getFieldsByCategory("computed"),
};

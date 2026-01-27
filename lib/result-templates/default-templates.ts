/**
 * Default Result Template Definitions
 * 
 * These templates provide a starting point for schools to customize their result sheets.
 * Each template is designed for A4 paper (794 x 1123 px at 96 DPI).
 */

export interface TemplateElement {
  id: string;
  type: "text" | "image" | "shape" | "dynamic" | "table" | "header" | "info-grid" | "subjects-table" | "traits-panel" | "remarks-section" | "grading-legend";
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  style: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TemplateDefinition {
  name: string;
  description: string;
  level: "primary" | "junior_secondary" | "senior_secondary" | "all";
  canvasSize: { width: number; height: number };
  elements: TemplateElement[];
}

// Helper to generate unique IDs
const generateId = () => `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

/**
 * Primary School Template
 * Clean, colorful design suitable for younger students
 */
export const primarySchoolTemplate: TemplateDefinition = {
  name: "Primary School Report Card",
  description: "A colorful, easy-to-read template designed for primary school students (Primary 1-6)",
  level: "primary",
  canvasSize: { width: 794, height: 1123 },
  elements: [
    // School Header Background
    {
      id: generateId(),
      type: "shape",
      x: 0,
      y: 0,
      width: 794,
      height: 120,
      style: {
        backgroundColor: "#1e40af",
        borderRadius: 0,
      },
      metadata: { section: "header" }
    },
    // School Logo Placeholder
    {
      id: generateId(),
      type: "image",
      x: 30,
      y: 20,
      width: 80,
      height: 80,
      style: {},
      metadata: { field: "school_logo", isPlaceholder: true }
    },
    // School Name
    {
      id: generateId(),
      type: "dynamic",
      x: 130,
      y: 25,
      width: 534,
      height: 35,
      style: {
        fontSize: 24,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        color: "#ffffff",
        textAlign: "center",
      },
      metadata: { field: "school_name" }
    },
    // School Address/Motto
    {
      id: generateId(),
      type: "dynamic",
      x: 130,
      y: 60,
      width: 534,
      height: 20,
      style: {
        fontSize: 11,
        fontFamily: "Arial, sans-serif",
        color: "#e0e7ff",
        textAlign: "center",
      },
      metadata: { field: "school_address" }
    },
    // Report Card Title
    {
      id: generateId(),
      type: "text",
      x: 130,
      y: 95,
      width: 534,
      height: 25,
      content: "TERMINAL REPORT CARD",
      style: {
        fontSize: 14,
        fontFamily: "Arial, sans-serif",
        fontWeight: "bold",
        color: "#fbbf24",
        textAlign: "center",
        letterSpacing: "2px",
      },
      metadata: {}
    },
    // Student Photo Placeholder
    {
      id: generateId(),
      type: "image",
      x: 684,
      y: 20,
      width: 80,
      height: 80,
      style: {
        borderWidth: 2,
        borderColor: "#ffffff",
        borderRadius: 4,
      },
      metadata: { field: "student_photo", isPlaceholder: true }
    },
    // Student Info Section Background
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 130,
      width: 754,
      height: 80,
      style: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 4,
      },
      metadata: { section: "student_info" }
    },
    // Student Name Label
    {
      id: generateId(),
      type: "text",
      x: 30,
      y: 140,
      width: 100,
      height: 18,
      content: "STUDENT NAME:",
      style: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#64748b",
      },
      metadata: {}
    },
    // Student Name Value
    {
      id: generateId(),
      type: "dynamic",
      x: 130,
      y: 140,
      width: 200,
      height: 18,
      style: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e293b",
      },
      metadata: { field: "student_name" }
    },
    // Admission Number Label
    {
      id: generateId(),
      type: "text",
      x: 400,
      y: 140,
      width: 100,
      height: 18,
      content: "ADMISSION NO:",
      style: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#64748b",
      },
      metadata: {}
    },
    // Admission Number Value
    {
      id: generateId(),
      type: "dynamic",
      x: 500,
      y: 140,
      width: 150,
      height: 18,
      style: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e293b",
      },
      metadata: { field: "admission_number" }
    },
    // Class/Section Label
    {
      id: generateId(),
      type: "text",
      x: 30,
      y: 165,
      width: 60,
      height: 18,
      content: "CLASS:",
      style: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#64748b",
      },
      metadata: {}
    },
    // Class Value
    {
      id: generateId(),
      type: "dynamic",
      x: 90,
      y: 165,
      width: 100,
      height: 18,
      style: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e293b",
      },
      metadata: { field: "class_name" }
    },
    // Term Label
    {
      id: generateId(),
      type: "text",
      x: 200,
      y: 165,
      width: 50,
      height: 18,
      content: "TERM:",
      style: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#64748b",
      },
      metadata: {}
    },
    // Term Value
    {
      id: generateId(),
      type: "dynamic",
      x: 250,
      y: 165,
      width: 100,
      height: 18,
      style: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e293b",
      },
      metadata: { field: "term_name" }
    },
    // Session Label
    {
      id: generateId(),
      type: "text",
      x: 400,
      y: 165,
      width: 70,
      height: 18,
      content: "SESSION:",
      style: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#64748b",
      },
      metadata: {}
    },
    // Session Value
    {
      id: generateId(),
      type: "dynamic",
      x: 470,
      y: 165,
      width: 150,
      height: 18,
      style: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e293b",
      },
      metadata: { field: "academic_session" }
    },
    // Gender Label
    {
      id: generateId(),
      type: "text",
      x: 30,
      y: 190,
      width: 60,
      height: 18,
      content: "GENDER:",
      style: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#64748b",
      },
      metadata: {}
    },
    // Gender Value
    {
      id: generateId(),
      type: "dynamic",
      x: 90,
      y: 190,
      width: 80,
      height: 18,
      style: {
        fontSize: 12,
        color: "#1e293b",
      },
      metadata: { field: "gender" }
    },
    // Summary Statistics Section
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 220,
      width: 754,
      height: 45,
      style: {
        backgroundColor: "#fef3c7",
        borderWidth: 1,
        borderColor: "#fbbf24",
        borderRadius: 4,
      },
      metadata: { section: "summary" }
    },
    // Total Score
    {
      id: generateId(),
      type: "text",
      x: 30,
      y: 230,
      width: 100,
      height: 14,
      content: "TOTAL SCORE:",
      style: { fontSize: 10, fontWeight: "bold", color: "#92400e" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 30,
      y: 244,
      width: 100,
      height: 16,
      style: { fontSize: 14, fontWeight: "bold", color: "#1e293b" },
      metadata: { field: "total_score" }
    },
    // Average Score
    {
      id: generateId(),
      type: "text",
      x: 180,
      y: 230,
      width: 100,
      height: 14,
      content: "AVERAGE:",
      style: { fontSize: 10, fontWeight: "bold", color: "#92400e" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 180,
      y: 244,
      width: 80,
      height: 16,
      style: { fontSize: 14, fontWeight: "bold", color: "#1e293b" },
      metadata: { field: "average_score" }
    },
    // Position
    {
      id: generateId(),
      type: "text",
      x: 300,
      y: 230,
      width: 100,
      height: 14,
      content: "POSITION:",
      style: { fontSize: 10, fontWeight: "bold", color: "#92400e" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 300,
      y: 244,
      width: 80,
      height: 16,
      style: { fontSize: 14, fontWeight: "bold", color: "#1e293b" },
      metadata: { field: "position" }
    },
    // Grade
    {
      id: generateId(),
      type: "text",
      x: 420,
      y: 230,
      width: 80,
      height: 14,
      content: "GRADE:",
      style: { fontSize: 10, fontWeight: "bold", color: "#92400e" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 420,
      y: 244,
      width: 50,
      height: 16,
      style: { fontSize: 14, fontWeight: "bold", color: "#1e293b" },
      metadata: { field: "overall_grade" }
    },
    // Students in Class
    {
      id: generateId(),
      type: "text",
      x: 520,
      y: 230,
      width: 120,
      height: 14,
      content: "NO. IN CLASS:",
      style: { fontSize: 10, fontWeight: "bold", color: "#92400e" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 520,
      y: 244,
      width: 50,
      height: 16,
      style: { fontSize: 14, fontWeight: "bold", color: "#1e293b" },
      metadata: { field: "students_in_class" }
    },
    // Status Badge
    {
      id: generateId(),
      type: "dynamic",
      x: 650,
      y: 230,
      width: 100,
      height: 30,
      style: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#ffffff",
        backgroundColor: "#22c55e",
        borderRadius: 4,
        textAlign: "center",
        padding: 6,
      },
      metadata: { field: "result_status" }
    },
    // Subjects Table Header
    {
      id: generateId(),
      type: "text",
      x: 20,
      y: 275,
      width: 200,
      height: 20,
      content: "COGNITIVE DOMAIN",
      style: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#1e40af",
        textAlign: "left",
      },
      metadata: {}
    },
    // Main Subjects Table
    {
      id: generateId(),
      type: "table",
      x: 20,
      y: 300,
      width: 550,
      height: 400,
      style: {
        borderColor: "#1e40af",
        borderWidth: 1,
        fontSize: 10,
        headerBgColor: "#1e40af",
        headerTextColor: "#ffffff",
        altRowColor: "#f1f5f9",
      },
      metadata: {
        tableType: "subjects",
        rows: 12,
        cols: 9,
        headers: ["SUBJECTS", "1ST CA", "2ND CA", "EXAM", "TOTAL", "GRADE", "POS.", "HIGH", "LOW"],
        columnWidths: [120, 45, 45, 50, 50, 45, 40, 45, 45],
        dynamicRows: true,
      }
    },
    // Affective Traits Section Header
    {
      id: generateId(),
      type: "text",
      x: 585,
      y: 275,
      width: 180,
      height: 20,
      content: "AFFECTIVE DOMAIN",
      style: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#1e40af",
        textAlign: "center",
      },
      metadata: {}
    },
    // Affective Traits Table
    {
      id: generateId(),
      type: "table",
      x: 585,
      y: 300,
      width: 185,
      height: 180,
      style: {
        borderColor: "#1e40af",
        borderWidth: 1,
        fontSize: 9,
        headerBgColor: "#1e40af",
        headerTextColor: "#ffffff",
      },
      metadata: {
        tableType: "affective",
        rows: 8,
        cols: 2,
        headers: ["TRAITS", "RATING"],
        columnWidths: [140, 45],
        traits: ["Punctuality", "Neatness", "Politeness", "Honesty", "Cooperation", "Attentiveness", "Perseverance", "Attitude to Work"],
      }
    },
    // Psychomotor Skills Header
    {
      id: generateId(),
      type: "text",
      x: 585,
      y: 490,
      width: 180,
      height: 20,
      content: "PSYCHOMOTOR DOMAIN",
      style: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#1e40af",
        textAlign: "center",
      },
      metadata: {}
    },
    // Psychomotor Skills Table
    {
      id: generateId(),
      type: "table",
      x: 585,
      y: 515,
      width: 185,
      height: 140,
      style: {
        borderColor: "#1e40af",
        borderWidth: 1,
        fontSize: 9,
        headerBgColor: "#1e40af",
        headerTextColor: "#ffffff",
      },
      metadata: {
        tableType: "psychomotor",
        rows: 6,
        cols: 2,
        headers: ["SKILLS", "RATING"],
        columnWidths: [140, 45],
        skills: ["Handwriting", "Sports", "Drawing", "Verbal Fluency", "Musical Skills", "Handling Tools"],
      }
    },
    // Grading Scale
    {
      id: generateId(),
      type: "shape",
      x: 585,
      y: 665,
      width: 185,
      height: 110,
      style: {
        backgroundColor: "#fef3c7",
        borderWidth: 1,
        borderColor: "#fbbf24",
        borderRadius: 4,
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 590,
      y: 670,
      width: 175,
      height: 16,
      content: "GRADING SCALE",
      style: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#92400e",
        textAlign: "center",
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 590,
      y: 688,
      width: 175,
      height: 80,
      style: {
        fontSize: 8,
        color: "#1e293b",
        lineHeight: 1.4,
      },
      metadata: { field: "grading_scale", displayType: "list" }
    },
    // Teacher's Comments Section
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 710,
      width: 550,
      height: 60,
      style: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 4,
      },
      metadata: { section: "comments" }
    },
    {
      id: generateId(),
      type: "text",
      x: 30,
      y: 715,
      width: 150,
      height: 14,
      content: "CLASS TEACHER'S REMARKS:",
      style: { fontSize: 10, fontWeight: "bold", color: "#64748b" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 30,
      y: 732,
      width: 530,
      height: 30,
      style: { fontSize: 11, color: "#1e293b", fontStyle: "italic" },
      metadata: { field: "teacher_comment" }
    },
    // Principal's Comments Section
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 780,
      width: 550,
      height: 60,
      style: {
        backgroundColor: "#f8fafc",
        borderWidth: 1,
        borderColor: "#e2e8f0",
        borderRadius: 4,
      },
      metadata: { section: "principal_comments" }
    },
    {
      id: generateId(),
      type: "text",
      x: 30,
      y: 785,
      width: 150,
      height: 14,
      content: "PRINCIPAL'S REMARKS:",
      style: { fontSize: 10, fontWeight: "bold", color: "#64748b" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 30,
      y: 802,
      width: 530,
      height: 30,
      style: { fontSize: 11, color: "#1e293b", fontStyle: "italic" },
      metadata: { field: "admin_comment" }
    },
    // Attendance Section
    {
      id: generateId(),
      type: "shape",
      x: 585,
      y: 785,
      width: 185,
      height: 55,
      style: {
        backgroundColor: "#f0fdf4",
        borderWidth: 1,
        borderColor: "#22c55e",
        borderRadius: 4,
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 590,
      y: 790,
      width: 175,
      height: 14,
      content: "ATTENDANCE",
      style: { fontSize: 10, fontWeight: "bold", color: "#166534", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 590,
      y: 808,
      width: 80,
      height: 12,
      content: "Days Present:",
      style: { fontSize: 9, color: "#64748b" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 670,
      y: 808,
      width: 30,
      height: 12,
      style: { fontSize: 9, fontWeight: "bold", color: "#1e293b" },
      metadata: { field: "days_present" }
    },
    {
      id: generateId(),
      type: "text",
      x: 590,
      y: 822,
      width: 80,
      height: 12,
      content: "Days Absent:",
      style: { fontSize: 9, color: "#64748b" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 670,
      y: 822,
      width: 30,
      height: 12,
      style: { fontSize: 9, fontWeight: "bold", color: "#1e293b" },
      metadata: { field: "days_absent" }
    },
    // Signature Section
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 850,
      width: 754,
      height: 50,
      style: {
        backgroundColor: "#ffffff",
        borderTop: "1px dashed #cbd5e1",
      },
      metadata: { section: "signatures" }
    },
    {
      id: generateId(),
      type: "text",
      x: 30,
      y: 875,
      width: 180,
      height: 12,
      content: "____________________",
      style: { fontSize: 10, color: "#1e293b", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 30,
      y: 890,
      width: 180,
      height: 12,
      content: "Class Teacher's Signature",
      style: { fontSize: 9, color: "#64748b", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 300,
      y: 875,
      width: 180,
      height: 12,
      content: "____________________",
      style: { fontSize: 10, color: "#1e293b", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 300,
      y: 890,
      width: 180,
      height: 12,
      content: "Principal's Signature",
      style: { fontSize: 9, color: "#64748b", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 570,
      y: 860,
      width: 180,
      height: 12,
      content: "School Stamp",
      style: { fontSize: 9, color: "#64748b", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "shape",
      x: 620,
      y: 875,
      width: 80,
      height: 80,
      style: {
        borderWidth: 2,
        borderColor: "#e2e8f0",
        borderStyle: "dashed",
        borderRadius: 4,
        backgroundColor: "transparent",
      },
      metadata: { field: "school_stamp", isPlaceholder: true }
    },
    // Footer
    {
      id: generateId(),
      type: "shape",
      x: 0,
      y: 1090,
      width: 794,
      height: 33,
      style: {
        backgroundColor: "#1e40af",
      },
      metadata: { section: "footer" }
    },
    {
      id: generateId(),
      type: "text",
      x: 30,
      y: 1098,
      width: 734,
      height: 14,
      content: "This report is computer-generated and valid without signature or stamp. For inquiries, contact the school.",
      style: {
        fontSize: 9,
        color: "#ffffff",
        textAlign: "center",
      },
      metadata: {}
    },
  ]
};

/**
 * Secondary School Template
 * More detailed, formal design suitable for JSS/SSS students
 */
export const secondarySchoolTemplate: TemplateDefinition = {
  name: "Secondary School Report Card",
  description: "A professional, detailed template for secondary school students (JSS1-SS3)",
  level: "junior_secondary",
  canvasSize: { width: 794, height: 1123 },
  elements: [
    // Header Background with gradient effect using layered shapes
    {
      id: generateId(),
      type: "shape",
      x: 0,
      y: 0,
      width: 794,
      height: 100,
      style: {
        backgroundColor: "#7c2d12",
        borderRadius: 0,
      },
      metadata: { section: "header" }
    },
    {
      id: generateId(),
      type: "shape",
      x: 0,
      y: 100,
      width: 794,
      height: 10,
      style: {
        backgroundColor: "#fbbf24",
      },
      metadata: { section: "header_accent" }
    },
    // School Logo
    {
      id: generateId(),
      type: "image",
      x: 30,
      y: 15,
      width: 70,
      height: 70,
      style: {
        borderRadius: 35,
        borderWidth: 3,
        borderColor: "#fbbf24",
      },
      metadata: { field: "school_logo", isPlaceholder: true }
    },
    // School Name
    {
      id: generateId(),
      type: "dynamic",
      x: 110,
      y: 20,
      width: 574,
      height: 30,
      style: {
        fontSize: 22,
        fontFamily: "Georgia, serif",
        fontWeight: "bold",
        color: "#ffffff",
        textAlign: "center",
      },
      metadata: { field: "school_name" }
    },
    // School Motto/Address
    {
      id: generateId(),
      type: "dynamic",
      x: 110,
      y: 52,
      width: 574,
      height: 18,
      style: {
        fontSize: 10,
        fontStyle: "italic",
        color: "#fef3c7",
        textAlign: "center",
      },
      metadata: { field: "school_motto" }
    },
    // Report Title
    {
      id: generateId(),
      type: "text",
      x: 110,
      y: 72,
      width: 574,
      height: 22,
      content: "STUDENT'S ACADEMIC REPORT CARD",
      style: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#fbbf24",
        textAlign: "center",
        letterSpacing: "3px",
      },
      metadata: {}
    },
    // Student Photo
    {
      id: generateId(),
      type: "image",
      x: 700,
      y: 15,
      width: 70,
      height: 85,
      style: {
        borderWidth: 2,
        borderColor: "#fbbf24",
        borderRadius: 4,
      },
      metadata: { field: "student_photo", isPlaceholder: true }
    },
    // Student Info Grid - Row 1
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 120,
      width: 754,
      height: 30,
      style: {
        backgroundColor: "#fef3c7",
        borderWidth: 1,
        borderColor: "#fbbf24",
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 25,
      y: 126,
      width: 120,
      height: 18,
      content: "NAME OF STUDENT:",
      style: { fontSize: 10, fontWeight: "bold", color: "#7c2d12" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 145,
      y: 126,
      width: 230,
      height: 18,
      style: { fontSize: 11, fontWeight: "bold", color: "#1e293b" },
      metadata: { field: "student_name" }
    },
    {
      id: generateId(),
      type: "text",
      x: 400,
      y: 126,
      width: 110,
      height: 18,
      content: "ADMISSION NO.:",
      style: { fontSize: 10, fontWeight: "bold", color: "#7c2d12" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 510,
      y: 126,
      width: 100,
      height: 18,
      style: { fontSize: 11, fontWeight: "bold", color: "#1e293b" },
      metadata: { field: "admission_number" }
    },
    {
      id: generateId(),
      type: "text",
      x: 620,
      y: 126,
      width: 50,
      height: 18,
      content: "CLASS:",
      style: { fontSize: 10, fontWeight: "bold", color: "#7c2d12" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 670,
      y: 126,
      width: 100,
      height: 18,
      style: { fontSize: 11, fontWeight: "bold", color: "#1e293b" },
      metadata: { field: "class_name" }
    },
    // Student Info Grid - Row 2
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 150,
      width: 754,
      height: 30,
      style: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#fbbf24",
        borderTop: 0,
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 25,
      y: 156,
      width: 50,
      height: 18,
      content: "TERM:",
      style: { fontSize: 10, fontWeight: "bold", color: "#7c2d12" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 75,
      y: 156,
      width: 100,
      height: 18,
      style: { fontSize: 11, color: "#1e293b" },
      metadata: { field: "term_name" }
    },
    {
      id: generateId(),
      type: "text",
      x: 200,
      y: 156,
      width: 70,
      height: 18,
      content: "SESSION:",
      style: { fontSize: 10, fontWeight: "bold", color: "#7c2d12" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 270,
      y: 156,
      width: 100,
      height: 18,
      style: { fontSize: 11, color: "#1e293b" },
      metadata: { field: "academic_session" }
    },
    {
      id: generateId(),
      type: "text",
      x: 400,
      y: 156,
      width: 100,
      height: 18,
      content: "NO. IN CLASS:",
      style: { fontSize: 10, fontWeight: "bold", color: "#7c2d12" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 500,
      y: 156,
      width: 50,
      height: 18,
      style: { fontSize: 11, color: "#1e293b" },
      metadata: { field: "students_in_class" }
    },
    {
      id: generateId(),
      type: "text",
      x: 570,
      y: 156,
      width: 100,
      height: 18,
      content: "CLASS TEACHER:",
      style: { fontSize: 10, fontWeight: "bold", color: "#7c2d12" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 670,
      y: 156,
      width: 100,
      height: 18,
      style: { fontSize: 11, color: "#1e293b" },
      metadata: { field: "class_teacher" }
    },
    // Summary Statistics Row
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 180,
      width: 754,
      height: 35,
      style: {
        backgroundColor: "#7c2d12",
      },
      metadata: { section: "summary" }
    },
    {
      id: generateId(),
      type: "text",
      x: 25,
      y: 187,
      width: 120,
      height: 14,
      content: "TOTAL OBTAINABLE:",
      style: { fontSize: 9, fontWeight: "bold", color: "#fef3c7" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 145,
      y: 187,
      width: 60,
      height: 20,
      style: { fontSize: 14, fontWeight: "bold", color: "#ffffff" },
      metadata: { field: "total_obtainable" }
    },
    {
      id: generateId(),
      type: "text",
      x: 220,
      y: 187,
      width: 110,
      height: 14,
      content: "TOTAL OBTAINED:",
      style: { fontSize: 9, fontWeight: "bold", color: "#fef3c7" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 330,
      y: 187,
      width: 60,
      height: 20,
      style: { fontSize: 14, fontWeight: "bold", color: "#ffffff" },
      metadata: { field: "total_score" }
    },
    {
      id: generateId(),
      type: "text",
      x: 410,
      y: 187,
      width: 70,
      height: 14,
      content: "AVERAGE:",
      style: { fontSize: 9, fontWeight: "bold", color: "#fef3c7" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 480,
      y: 187,
      width: 50,
      height: 20,
      style: { fontSize: 14, fontWeight: "bold", color: "#fbbf24" },
      metadata: { field: "average_score" }
    },
    {
      id: generateId(),
      type: "text",
      x: 545,
      y: 187,
      width: 70,
      height: 14,
      content: "POSITION:",
      style: { fontSize: 9, fontWeight: "bold", color: "#fef3c7" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 615,
      y: 187,
      width: 50,
      height: 20,
      style: { fontSize: 14, fontWeight: "bold", color: "#fbbf24" },
      metadata: { field: "position" }
    },
    {
      id: generateId(),
      type: "text",
      x: 680,
      y: 187,
      width: 40,
      height: 14,
      content: "GRADE:",
      style: { fontSize: 9, fontWeight: "bold", color: "#fef3c7" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 720,
      y: 185,
      width: 45,
      height: 26,
      style: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#7c2d12",
        backgroundColor: "#fbbf24",
        borderRadius: 4,
        textAlign: "center",
        padding: 4,
      },
      metadata: { field: "overall_grade" }
    },
    // Main Content Area
    // Cognitive Domain Title
    {
      id: generateId(),
      type: "text",
      x: 20,
      y: 225,
      width: 250,
      height: 20,
      content: "COGNITIVE DOMAIN",
      style: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#7c2d12",
      },
      metadata: {}
    },
    // Main Subjects Table (larger for secondary school with more columns)
    {
      id: generateId(),
      type: "table",
      x: 20,
      y: 248,
      width: 560,
      height: 400,
      style: {
        borderColor: "#7c2d12",
        borderWidth: 1,
        fontSize: 9,
        headerBgColor: "#7c2d12",
        headerTextColor: "#ffffff",
        altRowColor: "#fef3c7",
      },
      metadata: {
        tableType: "subjects",
        rows: 15,
        cols: 10,
        headers: ["SUBJECTS", "1ST CA", "2ND CA", "3RD CA", "EXAM", "TOTAL", "GRADE", "POS.", "HIGHEST", "REMARK"],
        columnWidths: [100, 42, 42, 42, 50, 48, 40, 35, 50, 70],
        dynamicRows: true,
      }
    },
    // Side Panel for Affective & Psychomotor
    {
      id: generateId(),
      type: "text",
      x: 595,
      y: 225,
      width: 175,
      height: 18,
      content: "AFFECTIVE DOMAIN",
      style: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#7c2d12",
        textAlign: "center",
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "table",
      x: 595,
      y: 245,
      width: 175,
      height: 180,
      style: {
        borderColor: "#7c2d12",
        borderWidth: 1,
        fontSize: 8,
        headerBgColor: "#7c2d12",
        headerTextColor: "#ffffff",
      },
      metadata: {
        tableType: "affective",
        rows: 9,
        cols: 6,
        headers: ["TRAITS", "1", "2", "3", "4", "5"],
        traits: ["Punctuality", "Neatness", "Politeness", "Honesty", "Cooperation", "Attentiveness", "Obedience", "Self-Control"],
        ratingScale: true,
      }
    },
    // Psychomotor
    {
      id: generateId(),
      type: "text",
      x: 595,
      y: 435,
      width: 175,
      height: 18,
      content: "PSYCHOMOTOR DOMAIN",
      style: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#7c2d12",
        textAlign: "center",
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "table",
      x: 595,
      y: 455,
      width: 175,
      height: 140,
      style: {
        borderColor: "#7c2d12",
        borderWidth: 1,
        fontSize: 8,
        headerBgColor: "#7c2d12",
        headerTextColor: "#ffffff",
      },
      metadata: {
        tableType: "psychomotor",
        rows: 7,
        cols: 6,
        headers: ["SKILLS", "1", "2", "3", "4", "5"],
        skills: ["Handwriting", "Games/Sports", "Drawing", "Music", "Crafts", "Tools Use"],
        ratingScale: true,
      }
    },
    // Rating Key
    {
      id: generateId(),
      type: "shape",
      x: 595,
      y: 605,
      width: 175,
      height: 110,
      style: {
        backgroundColor: "#fef3c7",
        borderWidth: 1,
        borderColor: "#fbbf24",
        borderRadius: 4,
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 600,
      y: 610,
      width: 165,
      height: 14,
      content: "KEY TO RATINGS",
      style: { fontSize: 9, fontWeight: "bold", color: "#7c2d12", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 600,
      y: 626,
      width: 165,
      height: 85,
      content: "5 = Excellent\n4 = Very Good\n3 = Good\n2 = Fair\n1 = Poor",
      style: { fontSize: 8, color: "#1e293b", lineHeight: 1.6 },
      metadata: {}
    },
    // Comments Section
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 660,
      width: 560,
      height: 50,
      style: {
        backgroundColor: "#fef3c7",
        borderWidth: 1,
        borderColor: "#fbbf24",
        borderRadius: 4,
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 25,
      y: 665,
      width: 150,
      height: 12,
      content: "CLASS TEACHER'S REMARKS:",
      style: { fontSize: 9, fontWeight: "bold", color: "#7c2d12" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 25,
      y: 680,
      width: 550,
      height: 25,
      style: { fontSize: 10, color: "#1e293b", fontStyle: "italic" },
      metadata: { field: "teacher_comment" }
    },
    // Principal's Comment
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 720,
      width: 560,
      height: 50,
      style: {
        backgroundColor: "#fef3c7",
        borderWidth: 1,
        borderColor: "#fbbf24",
        borderRadius: 4,
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 25,
      y: 725,
      width: 150,
      height: 12,
      content: "PRINCIPAL'S REMARKS:",
      style: { fontSize: 9, fontWeight: "bold", color: "#7c2d12" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 25,
      y: 740,
      width: 550,
      height: 25,
      style: { fontSize: 10, color: "#1e293b", fontStyle: "italic" },
      metadata: { field: "admin_comment" }
    },
    // Grading Scale at bottom
    {
      id: generateId(),
      type: "shape",
      x: 595,
      y: 720,
      width: 175,
      height: 100,
      style: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#7c2d12",
        borderRadius: 4,
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 600,
      y: 725,
      width: 165,
      height: 14,
      content: "GRADING SCALE",
      style: { fontSize: 9, fontWeight: "bold", color: "#7c2d12", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 600,
      y: 740,
      width: 165,
      height: 75,
      style: { fontSize: 7, color: "#1e293b", lineHeight: 1.3 },
      metadata: { field: "grading_scale", displayType: "compact" }
    },
    // Term Dates
    {
      id: generateId(),
      type: "shape",
      x: 20,
      y: 780,
      width: 754,
      height: 35,
      style: {
        backgroundColor: "#f1f5f9",
        borderWidth: 1,
        borderColor: "#cbd5e1",
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 25,
      y: 788,
      width: 100,
      height: 12,
      content: "VACATION DATE:",
      style: { fontSize: 9, fontWeight: "bold", color: "#64748b" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 125,
      y: 788,
      width: 120,
      height: 12,
      style: { fontSize: 9, color: "#1e293b" },
      metadata: { field: "vacation_date" }
    },
    {
      id: generateId(),
      type: "text",
      x: 280,
      y: 788,
      width: 120,
      height: 12,
      content: "RESUMPTION DATE:",
      style: { fontSize: 9, fontWeight: "bold", color: "#64748b" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 400,
      y: 788,
      width: 120,
      height: 12,
      style: { fontSize: 9, color: "#1e293b" },
      metadata: { field: "resumption_date" }
    },
    {
      id: generateId(),
      type: "text",
      x: 560,
      y: 788,
      width: 120,
      height: 12,
      content: "NEXT TERM BEGINS:",
      style: { fontSize: 9, fontWeight: "bold", color: "#64748b" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 680,
      y: 788,
      width: 90,
      height: 12,
      style: { fontSize: 9, color: "#1e293b" },
      metadata: { field: "next_term_date" }
    },
    // Signature Section
    {
      id: generateId(),
      type: "text",
      x: 40,
      y: 830,
      width: 150,
      height: 12,
      content: "________________________",
      style: { fontSize: 10, color: "#1e293b", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 40,
      y: 845,
      width: 150,
      height: 12,
      content: "Class Teacher's Signature",
      style: { fontSize: 8, color: "#64748b", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 320,
      y: 830,
      width: 150,
      height: 12,
      content: "________________________",
      style: { fontSize: 10, color: "#1e293b", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "text",
      x: 320,
      y: 845,
      width: 150,
      height: 12,
      content: "Principal's Signature",
      style: { fontSize: 8, color: "#64748b", textAlign: "center" },
      metadata: {}
    },
    {
      id: generateId(),
      type: "shape",
      x: 600,
      y: 820,
      width: 70,
      height: 70,
      style: {
        borderWidth: 2,
        borderColor: "#7c2d12",
        borderStyle: "dashed",
        borderRadius: 4,
        backgroundColor: "transparent",
      },
      metadata: { field: "school_stamp", isPlaceholder: true }
    },
    {
      id: generateId(),
      type: "text",
      x: 600,
      y: 894,
      width: 70,
      height: 10,
      content: "School Stamp",
      style: { fontSize: 7, color: "#64748b", textAlign: "center" },
      metadata: {}
    },
    // Footer
    {
      id: generateId(),
      type: "shape",
      x: 0,
      y: 1045,
      width: 794,
      height: 28,
      style: {
        backgroundColor: "#7c2d12",
      },
      metadata: {}
    },
    {
      id: generateId(),
      type: "dynamic",
      x: 20,
      y: 1052,
      width: 754,
      height: 14,
      style: {
        fontSize: 8,
        color: "#fef3c7",
        textAlign: "center",
      },
      metadata: { field: "school_website" }
    },
  ]
};

/**
 * First Term Template (Periodic)
 * Focused on a single term's performance with no cumulative data
 */
export const firstTermTemplate: TemplateDefinition = {
  name: "Periodic (First Term Only)",
  description: "Standard report card for a single term without cumulative calculations",
  level: "all",
  canvasSize: { width: 794, height: 1123 },
  elements: [
    ...primarySchoolTemplate.elements.map(el => {
        if (el.type === 'table' && el.metadata?.tableType === 'subjects') {
            return {
                ...el,
                metadata: {
                    ...el.metadata,
                    headers: ["SUBJECTS", "CA 1", "CA 2", "EXAM", "TOTAL", "GRADE", "REMARK"],
                    cols: 7,
                    columnWidths: [180, 60, 60, 70, 70, 50, 60]
                }
            };
        }
        return el;
    })
  ]
};

/**
 * Mid-Year Template (Cumulative)
 * Includes first term scores for comparison
 */
export const midYearTemplate: TemplateDefinition = {
  name: "Cumulative (First & Second Term)",
  description: "Professional template with comparison between first and second term performance",
  level: "all",
  canvasSize: { width: 794, height: 1123 },
  elements: [
    ...secondarySchoolTemplate.elements.map(el => {
        if (el.type === 'table' && el.metadata?.tableType === 'subjects') {
            return {
                ...el,
                metadata: {
                    ...el.metadata,
                    headers: ["SUBJECTS", "1st TERM", "CA", "EXAM", "2nd TERM", "TOTAL", "AVG", "GRADE"],
                    cols: 8,
                    columnWidths: [140, 60, 50, 60, 60, 60, 60, 50]
                }
            };
        }
        return el;
    })
  ]
};

/**
 * Annual Template (Full Year)
 * Comprehensive report card for the entire academic year
 */
export const annualTemplate: TemplateDefinition = {
  name: "Full Academic Year (Annual)",
  description: "Comprehensive annual report with 1st, 2nd, and 3rd term cumulative performance",
  level: "all",
  canvasSize: { width: 794, height: 1123 },
  elements: [
    ...secondarySchoolTemplate.elements.map(el => {
        if (el.type === 'table' && el.metadata?.tableType === 'subjects') {
            return {
                ...el,
                metadata: {
                    ...el.metadata,
                    headers: ["SUBJECTS", "1st TERM", "2nd TERM", "3rd TERM", "ANNUAL AVG", "GRADE", "RESULT"],
                    cols: 7,
                    columnWidths: [160, 70, 70, 70, 90, 60, 70]
                }
            };
        }
        return el;
    })
  ]
};

/**
 * Get all available default templates
 */
export const defaultTemplates: TemplateDefinition[] = [
  primarySchoolTemplate,
  secondarySchoolTemplate,
  firstTermTemplate,
  midYearTemplate,
  annualTemplate,
];

/**
 * Get template by level
 */
export function getTemplateForLevel(level: string): TemplateDefinition {
  switch (level.toLowerCase()) {
    case "primary":
    case "nursery":
    case "kindergarten":
      return primarySchoolTemplate;
    case "junior_secondary":
    case "jss":
    case "senior_secondary":
    case "sss":
    default:
      return secondarySchoolTemplate;
  }
}

/**
 * Convert a template definition to editor state format
 */
export function templateToEditorState(template: TemplateDefinition) {
  return {
    elements: template.elements.map(el => ({
      ...el,
      id: generateId(), // Generate fresh IDs for each instance
    })),
    canvasSize: template.canvasSize,
  };
}

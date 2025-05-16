
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.5.0
 * Query Engine version: 173f8d54f8d52e692c7e27e72a88314ec7aeff60
 */
Prisma.prismaVersion = {
  client: "6.5.0",
  engine: "173f8d54f8d52e692c7e27e72a88314ec7aeff60"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  name: 'name',
  email: 'email',
  password: 'password',
  role: 'role',
  profileImage: 'profileImage',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  emailVerified: 'emailVerified',
  image: 'image',
  schoolId: 'schoolId'
};

exports.Prisma.AdminScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  adminType: 'adminType',
  permissions: 'permissions',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.TeacherScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  employeeId: 'employeeId',
  qualifications: 'qualifications',
  specialization: 'specialization',
  joiningDate: 'joiningDate',
  departmentId: 'departmentId',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  phone: 'phone',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  emergencyContact: 'emergencyContact',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  admissionDate: 'admissionDate',
  departmentId: 'departmentId',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  phone: 'phone',
  dateOfBirth: 'dateOfBirth',
  gender: 'gender',
  religion: 'religion',
  bloodGroup: 'bloodGroup',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  classId: 'classId'
};

exports.Prisma.ParentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  occupation: 'occupation',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  phone: 'phone',
  alternatePhone: 'alternatePhone',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SchoolScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address: 'address',
  phone: 'phone',
  email: 'email',
  logo: 'logo',
  subdomain: 'subdomain',
  primaryColor: 'primaryColor',
  secondaryColor: 'secondaryColor',
  shortName: 'shortName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DepartmentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  schoolId: 'schoolId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClassScalarFieldEnum = {
  id: 'id',
  name: 'name',
  section: 'section',
  schoolId: 'schoolId',
  teacherId: 'teacherId',
  levelId: 'levelId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubjectScalarFieldEnum = {
  id: 'id',
  name: 'name',
  code: 'code',
  description: 'description',
  schoolId: 'schoolId',
  departmentId: 'departmentId',
  levelId: 'levelId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AcademicSessionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  startDate: 'startDate',
  endDate: 'endDate',
  isCurrent: 'isCurrent',
  schoolId: 'schoolId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentClassScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  classId: 'classId',
  sessionId: 'sessionId',
  rollNumber: 'rollNumber',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentParentScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  parentId: 'parentId',
  relation: 'relation',
  isPrimary: 'isPrimary',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SubjectTeacherScalarFieldEnum = {
  id: 'id',
  subjectId: 'subjectId',
  teacherId: 'teacherId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ClassSubjectScalarFieldEnum = {
  id: 'id',
  classId: 'classId',
  subjectId: 'subjectId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AttendanceScalarFieldEnum = {
  id: 'id',
  date: 'date',
  status: 'status',
  studentId: 'studentId',
  sessionId: 'sessionId',
  remarks: 'remarks',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResultScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  subjectId: 'subjectId',
  periodId: 'periodId',
  sessionId: 'sessionId',
  total: 'total',
  grade: 'grade',
  remark: 'remark',
  cumulativeAverage: 'cumulativeAverage',
  affectiveTraits: 'affectiveTraits',
  psychomotorSkills: 'psychomotorSkills',
  customFields: 'customFields',
  teacherComment: 'teacherComment',
  adminComment: 'adminComment',
  approvedById: 'approvedById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  startDate: 'startDate',
  endDate: 'endDate',
  location: 'location',
  isPublic: 'isPublic',
  schoolId: 'schoolId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentSubjectScalarFieldEnum = {
  id: 'id',
  studentId: 'studentId',
  subjectId: 'subjectId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BillScalarFieldEnum = {
  id: 'id',
  name: 'name',
  amount: 'amount',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  schoolId: 'schoolId',
  accountId: 'accountId'
};

exports.Prisma.BillItemScalarFieldEnum = {
  id: 'id',
  billId: 'billId',
  name: 'name',
  amount: 'amount',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentAccountScalarFieldEnum = {
  id: 'id',
  name: 'name',
  accountNo: 'accountNo',
  bankName: 'bankName',
  branchCode: 'branchCode',
  description: 'description',
  isActive: 'isActive',
  schoolId: 'schoolId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BillAssignmentScalarFieldEnum = {
  id: 'id',
  billId: 'billId',
  targetType: 'targetType',
  targetId: 'targetId',
  dueDate: 'dueDate',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StudentPaymentScalarFieldEnum = {
  id: 'id',
  billAssignmentId: 'billAssignmentId',
  studentId: 'studentId',
  amountPaid: 'amountPaid',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PaymentRequestScalarFieldEnum = {
  id: 'id',
  billId: 'billId',
  billAssignmentId: 'billAssignmentId',
  studentPaymentId: 'studentPaymentId',
  studentId: 'studentId',
  amount: 'amount',
  receiptUrl: 'receiptUrl',
  status: 'status',
  notes: 'notes',
  processedById: 'processedById',
  processedAt: 'processedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SchoolLevelScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  order: 'order',
  schoolId: 'schoolId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserActivityLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  page: 'page',
  action: 'action',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.ApiRequestLogScalarFieldEnum = {
  id: 'id',
  route: 'route',
  method: 'method',
  status: 'status',
  duration: 'duration',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.ResultConfigurationScalarFieldEnum = {
  id: 'id',
  schoolId: 'schoolId',
  sessionId: 'sessionId',
  cumulativeEnabled: 'cumulativeEnabled',
  cumulativeMethod: 'cumulativeMethod',
  showCumulativePerTerm: 'showCumulativePerTerm',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ResultPeriodScalarFieldEnum = {
  id: 'id',
  name: 'name',
  weight: 'weight',
  configurationId: 'configurationId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AssessmentComponentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  key: 'key',
  maxScore: 'maxScore',
  configurationId: 'configurationId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GradingScaleScalarFieldEnum = {
  id: 'id',
  minScore: 'minScore',
  maxScore: 'maxScore',
  grade: 'grade',
  remark: 'remark',
  configurationId: 'configurationId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ComponentScoreScalarFieldEnum = {
  id: 'id',
  score: 'score',
  componentId: 'componentId',
  resultId: 'resultId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT'
};

exports.AdminType = exports.$Enums.AdminType = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SCHOOL_ADMIN: 'SCHOOL_ADMIN'
};

exports.EnrollmentStatus = exports.$Enums.EnrollmentStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  TRANSFERRED: 'TRANSFERRED',
  GRADUATED: 'GRADUATED'
};

exports.AttendanceStatus = exports.$Enums.AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED'
};

exports.BillAssignmentType = exports.$Enums.BillAssignmentType = {
  CLASS: 'CLASS',
  STUDENT: 'STUDENT'
};

exports.BillStatus = exports.$Enums.BillStatus = {
  PENDING: 'PENDING',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE'
};

exports.PaymentStatus = exports.$Enums.PaymentStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};

exports.Prisma.ModelName = {
  User: 'User',
  Admin: 'Admin',
  Teacher: 'Teacher',
  Student: 'Student',
  Parent: 'Parent',
  School: 'School',
  Department: 'Department',
  Class: 'Class',
  Subject: 'Subject',
  AcademicSession: 'AcademicSession',
  StudentClass: 'StudentClass',
  StudentParent: 'StudentParent',
  SubjectTeacher: 'SubjectTeacher',
  ClassSubject: 'ClassSubject',
  Attendance: 'Attendance',
  Result: 'Result',
  Event: 'Event',
  StudentSubject: 'StudentSubject',
  Bill: 'Bill',
  BillItem: 'BillItem',
  PaymentAccount: 'PaymentAccount',
  BillAssignment: 'BillAssignment',
  StudentPayment: 'StudentPayment',
  PaymentRequest: 'PaymentRequest',
  SchoolLevel: 'SchoolLevel',
  UserActivityLog: 'UserActivityLog',
  ApiRequestLog: 'ApiRequestLog',
  Account: 'Account',
  Session: 'Session',
  ResultConfiguration: 'ResultConfiguration',
  ResultPeriod: 'ResultPeriod',
  AssessmentComponent: 'AssessmentComponent',
  GradingScale: 'GradingScale',
  ComponentScore: 'ComponentScore'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)

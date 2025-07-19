-- CreateIndex
CREATE INDEX "AcademicSession_schoolId_idx" ON "AcademicSession"("schoolId");

-- CreateIndex
CREATE INDEX "AcademicSession_schoolId_isCurrent_idx" ON "AcademicSession"("schoolId", "isCurrent");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- CreateIndex
CREATE INDEX "Class_teacherId_idx" ON "Class"("teacherId");

-- CreateIndex
CREATE INDEX "Class_levelId_idx" ON "Class"("levelId");

-- CreateIndex
CREATE INDEX "Class_schoolId_name_idx" ON "Class"("schoolId", "name");

-- CreateIndex
CREATE INDEX "ClassSubject_classId_idx" ON "ClassSubject"("classId");

-- CreateIndex
CREATE INDEX "ClassSubject_subjectId_idx" ON "ClassSubject"("subjectId");

-- CreateIndex
CREATE INDEX "StudentClass_classId_idx" ON "StudentClass"("classId");

-- CreateIndex
CREATE INDEX "StudentClass_sessionId_idx" ON "StudentClass"("sessionId");

-- CreateIndex
CREATE INDEX "StudentClass_studentId_idx" ON "StudentClass"("studentId");

-- CreateIndex
CREATE INDEX "StudentClass_classId_sessionId_idx" ON "StudentClass"("classId", "sessionId");

-- CreateIndex
CREATE INDEX "StudentClass_classId_sessionId_status_idx" ON "StudentClass"("classId", "sessionId", "status");

-- CreateIndex
CREATE INDEX "Subject_schoolId_idx" ON "Subject"("schoolId");

-- CreateIndex
CREATE INDEX "Subject_departmentId_idx" ON "Subject"("departmentId");

-- CreateIndex
CREATE INDEX "Subject_levelId_idx" ON "Subject"("levelId");

-- CreateIndex
CREATE INDEX "Teacher_departmentId_idx" ON "Teacher"("departmentId");

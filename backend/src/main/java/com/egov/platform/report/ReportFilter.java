package com.egov.platform.report;

import java.time.LocalDate;
import java.util.UUID;

/** Shared filter shape for every standard report (SRS FR-10.1) - board/department/service/date range. */
public record ReportFilter(UUID boardId, UUID departmentId, UUID serviceId, LocalDate fromDate, LocalDate toDate) {}

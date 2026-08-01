package com.egov.platform.report;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
public class ReportController {

    private final ReportRepository reportRepository;

    public ReportController(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    @GetMapping("/api/reports/pendency")
    public List<Map<String, Object>> pendency(
            @RequestParam(required = false) UUID boardId,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID serviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return reportRepository.pendencyReport(boardId, departmentId, serviceId, fromDate, toDate)
                .stream()
                .map(row -> Map.<String, Object>of(
                        "applicationId", row[0],
                        "applicationNo", row[1] == null ? "" : row[1],
                        "status", row[2],
                        "currentStageId", row[3]))
                .toList();
    }
}

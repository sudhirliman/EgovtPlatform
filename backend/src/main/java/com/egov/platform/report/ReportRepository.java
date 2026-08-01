package com.egov.platform.report;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Example of the "generic, filter-driven" reporting approach from SRS FR-10.1/10.3:
 * one native query per standard report, all taking the same filter shape, so a
 * new report is usually a new query method here plus a ReportDefinition config
 * row rather than a bespoke module.
 *
 * Implemented as a plain class using JPA's EntityManager directly for the
 * native query (NOT a Spring Data JPA repository interface, and NOT
 * JdbcTemplate). A @RepositoryDefinition/@Query-based interface gets
 * auto-scanned by Spring Data JPA's repository infrastructure, which tries to
 * resolve a managed JPA entity for it and fails ("Not a managed type") since
 * this query spans multiple tables and isn't backed by a single @Entity.
 * EntityManager.createNativeQuery sidesteps that entirely while staying
 * within the JPA API already used everywhere else in this codebase.
 */
@Repository
public class ReportRepository {

    @PersistenceContext
    private EntityManager entityManager;

    /** Each row: [applicationId, applicationNo, status, currentStageId]. */
    @SuppressWarnings("unchecked")
    public List<Object[]> pendencyReport(UUID boardId, UUID departmentId, UUID serviceId,
                                          LocalDate fromDate, LocalDate toDate) {
        String sql = """
                SELECT a.id, a.application_no, a.status, wi.current_stage_id
                FROM application a
                JOIN application_workflow_instance wi ON wi.application_id = a.id
                JOIN service_master sm ON sm.id = a.service_id
                JOIN department d ON d.id = sm.department_id
                WHERE (CAST(:boardId AS uuid) IS NULL OR d.board_id = CAST(:boardId AS uuid))
                  AND (CAST(:departmentId AS uuid) IS NULL OR d.id = CAST(:departmentId AS uuid))
                  AND (CAST(:serviceId AS uuid) IS NULL OR sm.id = CAST(:serviceId AS uuid))
                  AND (CAST(:fromDate AS date) IS NULL OR a.created_at >= CAST(:fromDate AS date))
                  AND (CAST(:toDate AS date) IS NULL OR a.created_at <= CAST(:toDate AS date))
                  AND a.status NOT IN ('DISPATCHED', 'REJECTED')
                """;
        Query query = entityManager.createNativeQuery(sql)
                .setParameter("boardId", boardId)
                .setParameter("departmentId", departmentId)
                .setParameter("serviceId", serviceId)
                .setParameter("fromDate", fromDate)
                .setParameter("toDate", toDate);
        return query.getResultList();
    }
}

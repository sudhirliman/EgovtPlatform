package com.egov.platform.application;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    List<Application> findByApplicantUserIdAndStatus(UUID applicantUserId, Application.Status status);
    List<Application> findByApplicantUserId(UUID applicantUserId);
    List<Application> findByServiceId(UUID serviceId);

    // CFC queue queries
    List<Application> findByStatus(Application.Status status);
    List<Application> findByAssignedEmIdAndStatusIn(UUID emId, List<Application.Status> statuses);
    List<Application> findByAssignedClerkIdAndStatus(UUID clerkId, Application.Status status);
    List<Application> findByApplicantUserIdOrderByCreatedAtDesc(UUID applicantUserId);
}

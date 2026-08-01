package com.egov.platform.hierarchy;

import com.egov.platform.hierarchy.dto.ServiceRequest;
import com.egov.platform.hierarchy.dto.ServiceResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceMasterRepository serviceRepository;
    private final DepartmentRepository departmentRepository;

    public ServiceController(ServiceMasterRepository serviceRepository, DepartmentRepository departmentRepository) {
        this.serviceRepository = serviceRepository;
        this.departmentRepository = departmentRepository;
    }

    @GetMapping
    public List<ServiceResponse> list(@RequestParam(required = false) UUID departmentId) {
        List<ServiceMaster> services = departmentId != null
                ? serviceRepository.findByDepartmentId(departmentId)
                : serviceRepository.findAll();
        return services.stream().map(ServiceResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ServiceResponse get(@PathVariable UUID id) {
        return ServiceResponse.from(serviceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Service not found: " + id)));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public ServiceResponse create(@Valid @RequestBody ServiceRequest request) {
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new NoSuchElementException("Department not found: " + request.departmentId()));
        ServiceMaster service = new ServiceMaster();
        service.setDepartment(department);
        applyRequest(service, request);
        return ServiceResponse.from(serviceRepository.save(service));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public ServiceResponse update(@PathVariable UUID id, @Valid @RequestBody ServiceRequest request) {
        ServiceMaster service = serviceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Service not found: " + id));
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new NoSuchElementException("Department not found: " + request.departmentId()));
        service.setDepartment(department);
        applyRequest(service, request);
        return ServiceResponse.from(serviceRepository.save(service));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        ServiceMaster service = serviceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Service not found: " + id));
        service.setActive(false);
        serviceRepository.save(service);
        return ResponseEntity.noContent().build();
    }

    private void applyRequest(ServiceMaster service, ServiceRequest request) {
        service.setNameEnglish(request.nameEnglish());
        service.setNameMarathi(request.nameMarathi());
        service.setCode(request.code());
        service.setDescription(request.description());
        service.setServiceCategory(request.serviceCategory());
        service.setServiceType(request.serviceType());
        if (request.applicability() != null) service.setApplicability(request.applicability());
        if (request.mode() != null) service.setMode(request.mode());
        if (request.applicationFee() != null) service.setApplicationFee(request.applicationFee());
        if (request.processingFee() != null) service.setProcessingFee(request.processingFee());
        if (request.securityDeposit() != null) service.setSecurityDeposit(request.securityDeposit());
        service.setSlaDays(request.slaDays());
        service.setApplicationNumberFormat(request.applicationNumberFormat());
        service.setCertificateNumberFormat(request.certificateNumberFormat());
        if (request.active() != null) service.setActive(request.active());
        if (request.workingDaysOnly() != null) service.setWorkingDaysOnly(request.workingDaysOnly());
        if (request.approvalRequired() != null) service.setApprovalRequired(request.approvalRequired());
        if (request.digitalSignatureRequired() != null) service.setDigitalSignatureRequired(request.digitalSignatureRequired());
        if (request.aaplesarkarIntegrationRequired() != null) service.setAaplesarkarIntegrationRequired(request.aaplesarkarIntegrationRequired());
        if (request.digilockerIntegrationRequired() != null) service.setDigilockerIntegrationRequired(request.digilockerIntegrationRequired());
        if (request.challanRequired() != null) service.setChallanRequired(request.challanRequired());
        if (request.qrCodeRequired() != null) service.setQrCodeRequired(request.qrCodeRequired());
        if (request.appealAllowed() != null) service.setAppealAllowed(request.appealAllowed());
        if (request.grievanceAllowed() != null) service.setGrievanceAllowed(request.grievanceAllowed());
    }
}

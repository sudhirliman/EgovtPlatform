package com.egov.platform.form;

import com.egov.platform.form.dto.FormFieldResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Single endpoint the citizen-facing React form renderer calls to get
 * everything it needs for a service: field definitions + document checklist
 * (SRS section 3.3). Keeping both in one response avoids two round trips and
 * matches the "combine data updated together" guidance used elsewhere.
 */
@RestController
public class ServiceFormSchemaController {

    private final FormTemplateRepository formTemplateRepository;
    private final FormFieldRepository formFieldRepository;
    private final ServiceDocumentConfigRepository documentConfigRepository;

    public ServiceFormSchemaController(FormTemplateRepository formTemplateRepository,
                                        FormFieldRepository formFieldRepository,
                                        ServiceDocumentConfigRepository documentConfigRepository) {
        this.formTemplateRepository = formTemplateRepository;
        this.formFieldRepository = formFieldRepository;
        this.documentConfigRepository = documentConfigRepository;
    }

    @GetMapping("/api/services/{serviceId}/form-schema")
    public Map<String, Object> getSchema(@PathVariable UUID serviceId) {
        List<FormFieldResponse> fields = formTemplateRepository.findByServiceIdAndActiveTrue(serviceId)
                .map(t -> formFieldRepository.findByFormTemplateIdOrderByDisplayOrderAsc(t.getId()))
                .orElse(List.of())
                .stream().map(FormFieldResponse::from).toList();

        List<ServiceDocumentConfig> documents =
                documentConfigRepository.findByServiceIdAndActiveTrueOrderByDisplayOrderAsc(serviceId);

        return Map.of("fields", fields, "documents", documents);
    }
}

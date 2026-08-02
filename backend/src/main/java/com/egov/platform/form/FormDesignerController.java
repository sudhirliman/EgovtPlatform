package com.egov.platform.form;

import com.egov.platform.form.dto.CreateDocumentConfigRequest;
import com.egov.platform.form.dto.CreateFieldRequest;
import com.egov.platform.form.dto.FormFieldResponse;
import com.egov.platform.form.dto.ReorderRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * Superadmin-facing form + document checklist builder (SRS section 3.3).
 * Full CRUD + reordering for both fields and the document checklist - not
 * just add/list, so the builder can actually be maintained over time as a
 * service's requirements change.
 */
@RestController
@RequestMapping("/api/services/{serviceId}/form-designer")
public class FormDesignerController {

    private final FormTemplateRepository formTemplateRepository;
    private final FormFieldRepository formFieldRepository;
    private final ServiceDocumentConfigRepository documentConfigRepository;

    public FormDesignerController(FormTemplateRepository formTemplateRepository, FormFieldRepository formFieldRepository,
                                   ServiceDocumentConfigRepository documentConfigRepository) {
        this.formTemplateRepository = formTemplateRepository;
        this.formFieldRepository = formFieldRepository;
        this.documentConfigRepository = documentConfigRepository;
    }

    // ---------- Fields ----------

    @GetMapping("/fields")
    public List<FormFieldResponse> fields(@PathVariable UUID serviceId) {
        return formTemplateRepository.findByServiceIdAndActiveTrue(serviceId)
                .map(t -> formFieldRepository.findByFormTemplateIdOrderByDisplayOrderAsc(t.getId()))
                .orElse(List.of())
                .stream().map(FormFieldResponse::from).toList();
    }

    @PostMapping("/fields")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public FormFieldResponse addField(@PathVariable UUID serviceId, @RequestBody CreateFieldRequest request) {
        FormTemplate template = formTemplateRepository.findByServiceIdAndActiveTrue(serviceId)
                .orElseGet(() -> {
                    FormTemplate t = new FormTemplate();
                    t.setServiceId(serviceId);
                    return formTemplateRepository.save(t);
                });

        FormField field = new FormField();
        field.setFormTemplate(template);
        applyField(field, request);
        return FormFieldResponse.from(formFieldRepository.save(field));
    }

    @PutMapping("/fields/{fieldId}")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public FormFieldResponse updateField(@PathVariable UUID serviceId, @PathVariable UUID fieldId,
                                          @RequestBody CreateFieldRequest request) {
        FormField field = formFieldRepository.findById(fieldId)
                .orElseThrow(() -> new NoSuchElementException("Field not found: " + fieldId));
        applyField(field, request);
        return FormFieldResponse.from(formFieldRepository.save(field));
    }

    @DeleteMapping("/fields/{fieldId}")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public ResponseEntity<Void> deleteField(@PathVariable UUID serviceId, @PathVariable UUID fieldId) {
        formFieldRepository.deleteById(fieldId);
        return ResponseEntity.noContent().build();
    }

    /** Bulk reorder - pass the fields' ids in the new desired order. */
    @PatchMapping("/fields/reorder")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public List<FormFieldResponse> reorderFields(@PathVariable UUID serviceId, @RequestBody ReorderRequest request) {
        List<FormField> updated = new java.util.ArrayList<>();
        int order = 0;
        for (UUID id : request.orderedIds()) {
            FormField field = formFieldRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("Field not found: " + id));
            field.setDisplayOrder(order++);
            updated.add(formFieldRepository.save(field));
        }
        return updated.stream().map(FormFieldResponse::from).toList();
    }

    private void applyField(FormField field, CreateFieldRequest request) {
        field.setFieldKey(request.fieldKey());
        field.setLabel(request.label());
        field.setLabelMarathi(request.labelMarathi());
        field.setType(request.type());
        field.setRequired(request.required());
        field.setFullWidth(request.fullWidth());
        field.setDisplayOrder(request.displayOrder());
        field.setValidationRules(request.validationRules());
        field.setConditionFieldKey(request.conditionFieldKey());
        field.setConditionOperator(request.conditionOperator());
        field.setConditionValue(request.conditionValue());
        field.setRequiredConditionFieldKey(request.requiredConditionFieldKey());
        field.setRequiredConditionOperator(request.requiredConditionOperator());
        field.setRequiredConditionValue(request.requiredConditionValue());
        field.setCrossValidateFieldKey(request.crossValidateFieldKey());
        field.setCrossValidateOperator(request.crossValidateOperator());
        field.setCrossValidateMessage(request.crossValidateMessage());
    }

    // ---------- Documents ----------

    @GetMapping("/documents")
    public List<ServiceDocumentConfig> documents(@PathVariable UUID serviceId) {
        return documentConfigRepository.findByServiceIdAndActiveTrueOrderByDisplayOrderAsc(serviceId);
    }

    @PostMapping("/documents")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public ServiceDocumentConfig addDocument(@PathVariable UUID serviceId, @RequestBody CreateDocumentConfigRequest request) {
        ServiceDocumentConfig config = new ServiceDocumentConfig();
        config.setServiceId(serviceId);
        applyDocument(config, request);
        return documentConfigRepository.save(config);
    }

    @PutMapping("/documents/{docId}")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public ServiceDocumentConfig updateDocument(@PathVariable UUID serviceId, @PathVariable UUID docId,
                                                 @RequestBody CreateDocumentConfigRequest request) {
        ServiceDocumentConfig config = documentConfigRepository.findById(docId)
                .orElseThrow(() -> new NoSuchElementException("Document config not found: " + docId));
        applyDocument(config, request);
        return documentConfigRepository.save(config);
    }

    /** Soft-delete: ApplicationDocument rows can reference a document config, so we deactivate rather than hard-delete. */
    @PatchMapping("/documents/{docId}/deactivate")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public ResponseEntity<Void> deactivateDocument(@PathVariable UUID serviceId, @PathVariable UUID docId) {
        ServiceDocumentConfig config = documentConfigRepository.findById(docId)
                .orElseThrow(() -> new NoSuchElementException("Document config not found: " + docId));
        config.setActive(false);
        documentConfigRepository.save(config);
        return ResponseEntity.noContent().build();
    }

    /** Bulk reorder for the document checklist, same pattern as field reordering. */
    @PatchMapping("/documents/reorder")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public List<ServiceDocumentConfig> reorderDocuments(@PathVariable UUID serviceId, @RequestBody ReorderRequest request) {
        List<ServiceDocumentConfig> updated = new java.util.ArrayList<>();
        int order = 0;
        for (UUID id : request.orderedIds()) {
            ServiceDocumentConfig config = documentConfigRepository.findById(id)
                    .orElseThrow(() -> new NoSuchElementException("Document config not found: " + id));
            config.setDisplayOrder(order++);
            updated.add(documentConfigRepository.save(config));
        }
        return updated;
    }

    private void applyDocument(ServiceDocumentConfig config, CreateDocumentConfigRequest request) {
        config.setDocumentName(request.documentName());
        config.setDocumentCode(request.documentCode());
        config.setMandatory(request.mandatory());
        config.setAllowedFileTypes(request.allowedFileTypes());
        config.setMaxFileSizeMb(request.maxFileSizeMb());
        config.setMaxCount(request.maxCount());
        config.setDisplayOrder(request.displayOrder());
    }
}

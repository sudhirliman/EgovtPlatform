package com.egov.platform.form;

import com.egov.platform.form.dto.MasterFormFieldRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

/**
 * The "Form Fields" master under Master > Form Fields - a reusable field
 * library the Form Designer inserts from. Full CRUD, matching the same
 * pattern as the other masters (Board/Department/Service).
 */
@RestController
@RequestMapping("/api/master-form-fields")
public class MasterFormFieldController {

    private final MasterFormFieldRepository repository;

    public MasterFormFieldController(MasterFormFieldRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<MasterFormField> list() {
        return repository.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public MasterFormField create(@Valid @RequestBody MasterFormFieldRequest request) {
        MasterFormField field = new MasterFormField();
        applyRequest(field, request);
        return repository.save(field);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public MasterFormField update(@PathVariable UUID id, @Valid @RequestBody MasterFormFieldRequest request) {
        MasterFormField field = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Master form field not found: " + id));
        applyRequest(field, request);
        return repository.save(field);
    }

    /**
     * Hard delete is safe here: inserting a master field into a service's form
     * just copies its values into a new, independent FormField row - deleting
     * the master afterward does not affect any FormField already created from it.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        MasterFormField field = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Master form field not found: " + id));
        if (field.isSystemDefined()) {
            throw new IllegalStateException("System-defined fields (e.g. First Name, Email) cannot be deleted - deactivate instead.");
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasPermission(null, 'SERVICE_MANAGE')")
    public ResponseEntity<Void> deactivate(@PathVariable UUID id) {
        MasterFormField field = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Master form field not found: " + id));
        field.setActive(false);
        repository.save(field);
        return ResponseEntity.noContent().build();
    }

    private void applyRequest(MasterFormField field, MasterFormFieldRequest request) {
        field.setFieldKey(request.fieldKey());
        field.setLabel(request.label());
        field.setType(request.type());
        field.setValidationRules(request.validationRules());
        if (request.defaultRequired() != null) field.setDefaultRequired(request.defaultRequired());
        if (request.active() != null) field.setActive(request.active());
    }
}

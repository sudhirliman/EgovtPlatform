package com.egov.platform.form;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FormFieldRepository extends JpaRepository<FormField, UUID> {
    List<FormField> findByFormTemplateIdOrderByDisplayOrderAsc(UUID formTemplateId);
}

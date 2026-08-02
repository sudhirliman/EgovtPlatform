package com.egov.platform.form;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

/**
 * A reusable field definition ("field library") that the Form Designer can
 * insert from instead of typing fieldKey/label/type/options from scratch
 * every time - e.g. First Name, Email, Mobile Number, matching the common
 * applicant-identity fields already tracked on AppUser. Inserting one here
 * just pre-fills a new FormField for a specific service's form; the two are
 * otherwise independent (editing/deleting a master field never touches
 * FormFields already created from it).
 */
@Entity
@Table(name = "master_form_field")
@Getter
@Setter
@NoArgsConstructor
public class MasterFormField {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "field_key", nullable = false, unique = true, length = 100)
    private String fieldKey;

    @Column(nullable = false, length = 200)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FormField.FieldType type;

    // e.g. {"options":["Male","Female","Other"]} for DROPDOWN, or {"pattern":"^[0-9]{10}$"} for phone
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "validation_rules", columnDefinition = "jsonb")
    private String validationRules;

    @Column(name = "default_required", nullable = false)
    private boolean defaultRequired = false;

    // marks the built-in ones seeded from the AppUser table concept (first/middle/last name, email, mobile)
    // so the UI can show them distinctly and, if you choose, protect them from deletion.
    @Column(name = "is_system_defined", nullable = false)
    private boolean systemDefined = false;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "label_marathi", length = 200)
    private String labelMarathi;

    @Column(name = "full_width", nullable = false)
    private boolean fullWidth = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}

package com.egov.platform.form;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "form_field")
@Getter
@Setter
@NoArgsConstructor
public class FormField {

    public enum FieldType { TEXT, NUMBER, DATE, DROPDOWN, FILE, TEXTAREA, CHECKBOX }
    public enum ConditionOperator { EQUALS, NOT_EQUALS, IN }
    public enum CrossValidationOperator { EQUALS, NOT_EQUALS, GREATER_THAN, GREATER_THAN_OR_EQUAL, LESS_THAN, LESS_THAN_OR_EQUAL }

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "form_template_id", nullable = false)
    private FormTemplate formTemplate;

    // used as the JSON key in Application.formData - keep stable across form edits
    @Column(name = "field_key", nullable = false, length = 100)
    private String fieldKey;

    @Column(nullable = false, length = 200)
    private String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FieldType type;

    @Column(name = "is_required", nullable = false)
    private boolean required = false;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    // e.g. {"minLength":2,"maxLength":50,"pattern":"^[A-Za-z ]+$","options":["A","B"]}
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "validation_rules", columnDefinition = "jsonb")
    private String validationRules;

    // Conditional visibility: this field is only shown when the field whose
    // fieldKey matches conditionFieldKey (within the SAME form) has a value
    // that satisfies conditionOperator against conditionValue. Null
    // conditionFieldKey means "always visible" (the common case).
    // e.g. show "Caste Certificate Number" only when "category" IN "SC,ST,OBC".
    @Column(name = "condition_field_key", length = 100)
    private String conditionFieldKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "condition_operator", length = 20)
    private ConditionOperator conditionOperator;

    // For EQUALS/NOT_EQUALS: a single value. For IN: comma-separated values.
    @Column(name = "condition_value", length = 500)
    private String conditionValue;

    // Conditional REQUIRED-ness (separate from the static `required` flag above):
    // "if <requiredConditionFieldKey> <requiredConditionOperator> <requiredConditionValue>,
    // then THIS field becomes mandatory" - e.g. Caste Certificate Number becomes
    // required only when category IN SC,ST,OBC, even though it isn't required
    // for everyone. Null requiredConditionFieldKey means this rule doesn't apply
    // (the static `required` flag alone decides).
    @Column(name = "required_condition_field_key", length = 100)
    private String requiredConditionFieldKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "required_condition_operator", length = 20)
    private ConditionOperator requiredConditionOperator;

    @Column(name = "required_condition_value", length = 500)
    private String requiredConditionValue;

    // Cross-field comparison: this field's value must satisfy
    // crossValidateOperator against the value of crossValidateFieldKey -
    // e.g. "end_date" GREATER_THAN_OR_EQUAL "start_date". Applies to
    // NUMBER/DATE fields; crossValidateMessage is shown when the check fails.
    @Column(name = "cross_validate_field_key", length = 100)
    private String crossValidateFieldKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "cross_validate_operator", length = 30)
    private CrossValidationOperator crossValidateOperator;

    @Column(name = "cross_validate_message", length = 300)
    private String crossValidateMessage;
}

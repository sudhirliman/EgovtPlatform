package com.egov.platform.form.dto;

import com.egov.platform.form.FormField;

import java.util.UUID;

// Avoids returning the raw FormField entity: FormField.formTemplate is an
// eager @ManyToOne, but FormTemplate.fields (the collection it points back to)
// is a lazy @OneToMany - serializing the nested FormTemplate would trigger
// the same LazyInitializationException pattern fixed elsewhere (see
// RoleResponse's javadoc). Flattening to formTemplateId avoids it entirely.
public record FormFieldResponse(
        UUID id, UUID formTemplateId, String fieldKey, String label, FormField.FieldType type,
        boolean required, int displayOrder, String validationRules,
        String conditionFieldKey, FormField.ConditionOperator conditionOperator, String conditionValue,
        String requiredConditionFieldKey, FormField.ConditionOperator requiredConditionOperator, String requiredConditionValue,
        String crossValidateFieldKey, FormField.CrossValidationOperator crossValidateOperator, String crossValidateMessage
) {
    public static FormFieldResponse from(FormField f) {
        return new FormFieldResponse(f.getId(), f.getFormTemplate().getId(), f.getFieldKey(), f.getLabel(),
                f.getType(), f.isRequired(), f.getDisplayOrder(), f.getValidationRules(),
                f.getConditionFieldKey(), f.getConditionOperator(), f.getConditionValue(),
                f.getRequiredConditionFieldKey(), f.getRequiredConditionOperator(), f.getRequiredConditionValue(),
                f.getCrossValidateFieldKey(), f.getCrossValidateOperator(), f.getCrossValidateMessage());
    }
}

package com.egov.platform.form.dto;

import com.egov.platform.form.FormField;

public record CreateFieldRequest(
        String fieldKey, String label, FormField.FieldType type,
        boolean required, int displayOrder, String validationRules,
        String conditionFieldKey, FormField.ConditionOperator conditionOperator, String conditionValue,
        String requiredConditionFieldKey, FormField.ConditionOperator requiredConditionOperator, String requiredConditionValue,
        String crossValidateFieldKey, FormField.CrossValidationOperator crossValidateOperator, String crossValidateMessage
) {}

package com.egov.platform.hierarchy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record DepartmentRequest(@NotNull UUID boardId, @NotBlank String nameEnglish, String nameMarathi,
                                 @NotBlank String code, Boolean active) {}

package com.egov.platform.hierarchy.dto;

import jakarta.validation.constraints.NotBlank;

public record BoardRequest(@NotBlank String nameEnglish, String nameMarathi, @NotBlank String code, Boolean active) {}

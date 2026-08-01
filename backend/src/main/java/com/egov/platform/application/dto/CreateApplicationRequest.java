package com.egov.platform.application.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateApplicationRequest(@NotNull UUID serviceId, @NotNull UUID applicantUserId, String formData) {}

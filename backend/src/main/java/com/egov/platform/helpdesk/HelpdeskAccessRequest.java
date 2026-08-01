package com.egov.platform.helpdesk;

import jakarta.validation.constraints.NotBlank;

// userId removed — extracted from the JWT principal in HelpdeskController
// action removed — determined by the specific endpoint called
public record HelpdeskAccessRequest(@NotBlank String reason) {}

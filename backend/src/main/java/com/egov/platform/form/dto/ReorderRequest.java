package com.egov.platform.form.dto;

import java.util.List;
import java.util.UUID;

// Ordered list of ids - index in the list becomes the new displayOrder.
public record ReorderRequest(List<UUID> orderedIds) {}

package com.egov.platform.application;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "application_document")
@Getter
@Setter
@NoArgsConstructor
public class ApplicationDocument {

    public enum DocType { MANDATORY, EXTRA }

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    // null when document_type = EXTRA (citizen-added, not in the configured checklist)
    @Column(name = "document_config_id")
    private UUID documentConfigId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 20)
    private DocType documentType;

    // free-text label used only for EXTRA documents
    @Column(name = "custom_label", length = 200)
    private String customLabel;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt = Instant.now();
}

package com.egov.platform.form;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "service_document_config")
@Getter
@Setter
@NoArgsConstructor
public class ServiceDocumentConfig {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;

    @Column(name = "document_name", nullable = false, length = 200)
    private String documentName;

    @Column(name = "document_code", length = 60)
    private String documentCode;

    @Column(name = "is_mandatory", nullable = false)
    private boolean mandatory = true;

    // CSV, e.g. "pdf,jpg,png"
    @Column(name = "allowed_file_types", length = 100)
    private String allowedFileTypes;

    @Column(name = "max_file_size_mb")
    private Integer maxFileSizeMb;

    @Column(name = "max_count")
    private Integer maxCount = 1;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}

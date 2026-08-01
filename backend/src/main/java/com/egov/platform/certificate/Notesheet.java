package com.egov.platform.certificate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

// Auto-generated at dispatch: full application detail + audit trail, intended
// to support later legal/investigative use (e.g. a police enquiry) - SRS 3.9.
@Entity
@Table(name = "notesheet")
@Getter
@Setter
@NoArgsConstructor
public class Notesheet {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "application_id", nullable = false)
    private UUID applicationId;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    // SHA-256 of the generated PDF - lets a later reviewer detect tampering.
    @Column(nullable = false, length = 64)
    private String checksum;

    @Column(nullable = false)
    private int version = 1;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt = Instant.now();
}

package com.egov.platform.certificate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notesheet_access_log")
@Getter
@Setter
@NoArgsConstructor
public class NotesheetAccessLog {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "notesheet_id", nullable = false)
    private UUID notesheetId;

    @Column(name = "accessed_by", nullable = false)
    private UUID accessedBy;

    @Column(name = "accessed_at", nullable = false)
    private Instant accessedAt = Instant.now();
}

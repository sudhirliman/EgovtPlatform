package com.egov.platform.hierarchy;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "board")
@Getter
@Setter
@NoArgsConstructor
public class Board {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "name_english", nullable = false, length = 200)
    private String nameEnglish;

    @Column(name = "name_marathi", length = 200)
    private String nameMarathi;

    @Column(nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}

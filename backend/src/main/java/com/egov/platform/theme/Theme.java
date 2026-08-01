package com.egov.platform.theme;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "theme")
@Getter
@Setter
@NoArgsConstructor
public class Theme {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 100)
    private String name;

    // null = global default theme
    @Column(name = "board_id")
    private UUID boardId;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}

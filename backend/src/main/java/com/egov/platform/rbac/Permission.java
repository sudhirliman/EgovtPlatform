package com.egov.platform.rbac;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "permission")
@Getter
@Setter
@NoArgsConstructor
public class Permission {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    private String description;
}

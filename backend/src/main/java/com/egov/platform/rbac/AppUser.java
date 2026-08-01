package com.egov.platform.rbac;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

// Named AppUser (table: app_user) to avoid clashing with reserved SQL keyword USER.
@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(of = "id")
public class AppUser {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(unique = true, length = 50)
    private String username;

    @Column(nullable = false, unique = true, length = 15)
    private String mobile;

    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "employee_code", length = 20)
    private String employeeCode;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "user_type", length = 20, nullable = false)
    private String userType = "INTERNAL";

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}

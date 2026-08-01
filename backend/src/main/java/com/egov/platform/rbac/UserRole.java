package com.egov.platform.rbac;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

// Scopes a user's role to an optional board/department/service.
// Null scope columns combined with role.hasGlobalScope=true is how the
// Helpdesk-style cross-boundary access (see SRS section 3.12) is granted.
@Entity
@Table(name = "user_role")
@Getter
@Setter
@NoArgsConstructor
public class UserRole {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "board_id")
    private UUID boardId;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "service_id")
    private UUID serviceId;
}

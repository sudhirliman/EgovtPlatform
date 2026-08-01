package com.egov.platform.ticket;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "ticket_category")
@Getter
@Setter
@NoArgsConstructor
public class TicketCategory {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "category_name", nullable = false, length = 100)
    private String categoryName;

    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "default_assigned_role_id")
    private UUID defaultAssignedRoleId;

    @Column(name = "sla_hours")
    private Integer slaHours;
}

package com.egov.platform.sla;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "working_day_config")
@Getter
@Setter
@NoArgsConstructor
public class WorkingDayConfig {

    @Id
    @GeneratedValue
    private UUID id;

    // null/null = global default
    @Column(name = "board_id")
    private UUID boardId;

    @Column(name = "department_id")
    private UUID departmentId;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "working_day_config_days", joinColumns = @JoinColumn(name = "config_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week")
    private Set<DayOfWeek> workingDays;
}

package com.egov.platform.sla;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "holiday")
@Getter
@Setter
@NoArgsConstructor
public class Holiday {

    public enum Type { FULL_DAY, HALF_DAY, OPTIONAL }

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "calendar_id", nullable = false)
    private HolidayCalendar calendar;

    @Column(name = "holiday_date", nullable = false)
    private LocalDate holidayDate;

    @Column(name = "holiday_name", nullable = false, length = 200)
    private String holidayName;

    @Column(name = "is_recurring", nullable = false)
    private boolean recurring = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "holiday_type", nullable = false, length = 20)
    private Type type = Type.FULL_DAY;
}

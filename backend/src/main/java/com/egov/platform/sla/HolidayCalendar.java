package com.egov.platform.sla;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "holiday_calendar")
@Getter
@Setter
@NoArgsConstructor
public class HolidayCalendar {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "calendar_name", nullable = false, length = 200)
    private String calendarName;

    // null = applies globally across all boards
    @Column(name = "board_id")
    private UUID boardId;
}

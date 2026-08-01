package com.egov.platform.sla;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface HolidayRepository extends JpaRepository<Holiday, UUID> {
    List<Holiday> findByCalendarIdInAndHolidayDateBetween(List<UUID> calendarIds, LocalDate from, LocalDate to);
}

package com.egov.platform.sla;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HolidayCalendarRepository extends JpaRepository<HolidayCalendar, UUID> {
    List<HolidayCalendar> findByBoardIdOrBoardIdIsNull(UUID boardId);
}

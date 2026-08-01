package com.egov.platform.sla;

import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Shared, holiday- and working-day-aware SLA due-date calculator.
 * Used by both the workflow engine (WorkflowStage.slaHours) and the
 * support ticket module (TicketCategory.slaHours) so the logic is written once.
 *
 * NOTE: this is a straightforward day-skipping implementation (skips whole
 * non-working days, then adds the remaining hours) rather than an hour-by-hour
 * business-calendar walk. That is usually sufficient for SLAs expressed in
 * whole/part days; if sub-day precision across a boundary matters for your
 * rollout, refine addWorkingHours accordingly.
 */
@Service
public class BusinessDateCalculator {

    private static final Set<DayOfWeek> DEFAULT_WORKING_DAYS = Set.of(
            DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY, DayOfWeek.FRIDAY);

    private final HolidayCalendarRepository holidayCalendarRepository;
    private final HolidayRepository holidayRepository;
    private final WorkingDayConfigRepository workingDayConfigRepository;

    public BusinessDateCalculator(HolidayCalendarRepository holidayCalendarRepository,
                                   HolidayRepository holidayRepository,
                                   WorkingDayConfigRepository workingDayConfigRepository) {
        this.holidayCalendarRepository = holidayCalendarRepository;
        this.holidayRepository = holidayRepository;
        this.workingDayConfigRepository = workingDayConfigRepository;
    }

    /** Computes the SLA due date/time from a start instant, honouring holidays and non-working days. */
    public LocalDateTime addWorkingHours(LocalDateTime start, int slaHours, UUID boardId, UUID departmentId) {
        Set<DayOfWeek> workingDays = resolveWorkingDays(boardId, departmentId);
        List<UUID> calendarIds = holidayCalendarRepository.findByBoardIdOrBoardIdIsNull(boardId)
                .stream().map(HolidayCalendar::getId).toList();

        int fullDays = slaHours / 24;
        int remainderHours = slaHours % 24;

        LocalDate cursor = start.toLocalDate();
        int advanced = 0;
        while (advanced < fullDays) {
            cursor = cursor.plusDays(1);
            if (isWorkingDay(cursor, workingDays, calendarIds)) {
                advanced++;
            }
        }
        // land the remainder hours on the next available working day if the
        // current cursor day is itself non-working
        while (!isWorkingDay(cursor, workingDays, calendarIds)) {
            cursor = cursor.plusDays(1);
        }
        return LocalDateTime.of(cursor, start.toLocalTime()).plusHours(remainderHours);
    }

    private boolean isWorkingDay(LocalDate date, Set<DayOfWeek> workingDays, List<UUID> calendarIds) {
        if (!workingDays.contains(date.getDayOfWeek())) {
            return false;
        }
        if (calendarIds.isEmpty()) {
            return true;
        }
        boolean isHoliday = !holidayRepository
                .findByCalendarIdInAndHolidayDateBetween(calendarIds, date, date)
                .isEmpty();
        return !isHoliday;
    }

    private Set<DayOfWeek> resolveWorkingDays(UUID boardId, UUID departmentId) {
        return workingDayConfigRepository.findByBoardIdAndDepartmentId(boardId, departmentId)
                .map(WorkingDayConfig::getWorkingDays)
                .or(() -> workingDayConfigRepository.findByBoardIdIsNullAndDepartmentIdIsNull()
                        .map(WorkingDayConfig::getWorkingDays))
                .orElse(DEFAULT_WORKING_DAYS);
    }
}

CREATE TABLE holiday_calendar (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_name  VARCHAR(200) NOT NULL,
    board_id       UUID REFERENCES board(id)
);

CREATE TABLE holiday (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id    UUID NOT NULL REFERENCES holiday_calendar(id) ON DELETE CASCADE,
    holiday_date   DATE NOT NULL,
    holiday_name   VARCHAR(200) NOT NULL,
    is_recurring   BOOLEAN NOT NULL DEFAULT FALSE,
    holiday_type   VARCHAR(20) NOT NULL DEFAULT 'FULL_DAY'
);

CREATE INDEX idx_holiday_calendar_date ON holiday(calendar_id, holiday_date);

CREATE TABLE working_day_config (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id       UUID REFERENCES board(id),
    department_id  UUID REFERENCES department(id)
);

CREATE TABLE working_day_config_days (
    config_id      UUID NOT NULL REFERENCES working_day_config(id) ON DELETE CASCADE,
    day_of_week    VARCHAR(10) NOT NULL,
    PRIMARY KEY (config_id, day_of_week)
);

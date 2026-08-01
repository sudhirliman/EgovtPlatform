package com.egov.platform.theme;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ThemePropertyRepository extends JpaRepository<ThemeProperty, UUID> {
    List<ThemeProperty> findByThemeId(UUID themeId);
}

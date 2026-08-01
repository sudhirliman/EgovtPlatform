package com.egov.platform.theme;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ThemeRepository extends JpaRepository<Theme, UUID> {
    Optional<Theme> findByBoardIdAndActiveTrue(UUID boardId);
    Optional<Theme> findByBoardIdIsNullAndActiveTrue();
}

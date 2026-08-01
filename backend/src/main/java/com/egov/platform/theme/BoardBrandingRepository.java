package com.egov.platform.theme;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface BoardBrandingRepository extends JpaRepository<BoardBranding, UUID> {
    Optional<BoardBranding> findByBoardId(UUID boardId);
}

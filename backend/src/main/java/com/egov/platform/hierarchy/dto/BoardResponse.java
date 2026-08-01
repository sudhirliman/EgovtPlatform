package com.egov.platform.hierarchy.dto;

import com.egov.platform.hierarchy.Board;

import java.util.UUID;

public record BoardResponse(UUID id, String nameEnglish, String nameMarathi, String code, boolean active) {
    public static BoardResponse from(Board b) {
        return new BoardResponse(b.getId(), b.getNameEnglish(), b.getNameMarathi(), b.getCode(), b.isActive());
    }
}

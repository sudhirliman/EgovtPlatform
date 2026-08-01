package com.egov.platform.theme;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

// Frontend calls GET /api/theme?boardId=... on load and applies the result as
// CSS custom properties (see SRS section 3.8) - falls back to the global theme.
@RestController
public class ThemeController {

    private final ThemeRepository themeRepository;
    private final ThemePropertyRepository propertyRepository;
    private final BoardBrandingRepository brandingRepository;

    public ThemeController(ThemeRepository themeRepository, ThemePropertyRepository propertyRepository,
                            BoardBrandingRepository brandingRepository) {
        this.themeRepository = themeRepository;
        this.propertyRepository = propertyRepository;
        this.brandingRepository = brandingRepository;
    }

    @GetMapping("/api/theme")
    public Map<String, Object> getTheme(@RequestParam(required = false) UUID boardId) {
        Theme theme = (boardId != null ? themeRepository.findByBoardIdAndActiveTrue(boardId) : java.util.Optional.<Theme>empty())
                .or(themeRepository::findByBoardIdIsNullAndActiveTrue)
                .orElse(null);

        Map<String, Object> result = new HashMap<>();
        if (theme != null) {
            Map<String, String> props = new HashMap<>();
            propertyRepository.findByThemeId(theme.getId())
                    .forEach(p -> props.put(p.getPropertyKey(), p.getPropertyValue()));
            result.put("properties", props);
        }
        if (boardId != null) {
            brandingRepository.findByBoardId(boardId).ifPresent(b -> {
                result.put("logoUrl", b.getLogoUrl());
                result.put("faviconUrl", b.getFaviconUrl());
                result.put("footerText", b.getFooterText());
            });
        }
        return result;
    }
}

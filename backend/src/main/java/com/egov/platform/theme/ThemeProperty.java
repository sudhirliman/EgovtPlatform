package com.egov.platform.theme;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "theme_property")
@Getter
@Setter
@NoArgsConstructor
public class ThemeProperty {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "theme_id", nullable = false)
    private UUID themeId;

    // e.g. primary_color, secondary_color, font_family, button_radius
    @Column(name = "property_key", nullable = false, length = 60)
    private String propertyKey;

    @Column(name = "property_value", nullable = false, length = 200)
    private String propertyValue;
}

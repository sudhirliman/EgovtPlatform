package com.egov.platform.theme;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "board_branding")
@Getter
@Setter
@NoArgsConstructor
public class BoardBranding {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "board_id", nullable = false, unique = true)
    private UUID boardId;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "favicon_url")
    private String faviconUrl;

    @Column(name = "footer_text")
    private String footerText;
}

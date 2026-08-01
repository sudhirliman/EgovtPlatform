package com.egov.platform.certificate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "certificate_template")
@Getter
@Setter
@NoArgsConstructor
public class CertificateTemplate {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;

    // HTML with {{placeholder}} tokens bound to application/form data
    @Column(name = "template_html", nullable = false, columnDefinition = "TEXT")
    private String templateHtml;
}

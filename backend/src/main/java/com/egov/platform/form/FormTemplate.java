package com.egov.platform.form;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "form_template")
@Getter
@Setter
@NoArgsConstructor
public class FormTemplate {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "service_id", nullable = false)
    private UUID serviceId;

    @Column(nullable = false)
    private int version = 1;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "formTemplate", cascade = CascadeType.ALL)
    @OrderBy("displayOrder ASC")
    private List<FormField> fields = new ArrayList<>();
}

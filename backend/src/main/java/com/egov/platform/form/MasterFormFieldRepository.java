package com.egov.platform.form;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MasterFormFieldRepository extends JpaRepository<MasterFormField, UUID> {
    List<MasterFormField> findByActiveTrueOrderByLabelAsc();
}

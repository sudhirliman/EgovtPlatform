package com.egov.platform.rbac;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class PermissionController {

    private final PermissionRepository permissionRepository;

    public PermissionController(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    @GetMapping("/api/permissions")
    public List<Permission> list() {
        return permissionRepository.findAll();
    }
}

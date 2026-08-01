package com.egov.platform.rbac;

import com.egov.platform.rbac.dto.RoleRequest;
import com.egov.platform.rbac.dto.RoleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public RoleController(RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    // @Transactional keeps the Hibernate session open long enough to resolve
    // the lazy `permissions` collection into RoleResponse DTOs before this
    // method returns - see RoleResponse's javadoc for why this is required.
    @Transactional(readOnly = true)
    @GetMapping
    public List<RoleResponse> list() {
        return roleRepository.findAll().stream().map(RoleResponse::from).toList();
    }

    @Transactional
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'ROLE_MANAGE')")
    public RoleResponse create(@RequestBody RoleRequest request) {
        Role role = new Role();
        role.setName(request.name());
        role.setGlobalScope(request.hasGlobalScope());
        if (request.permissionIds() != null) {
            role.setPermissions(new HashSet<>(permissionRepository.findAllById(request.permissionIds())));
        }
        return RoleResponse.from(roleRepository.save(role));
    }

    @Transactional
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(null, 'ROLE_MANAGE')")
    public RoleResponse update(@PathVariable UUID id, @RequestBody RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Role not found: " + id));
        role.setName(request.name());
        role.setGlobalScope(request.hasGlobalScope());
        if (request.permissionIds() != null) {
            role.setPermissions(new HashSet<>(permissionRepository.findAllById(request.permissionIds())));
        }
        return RoleResponse.from(roleRepository.save(role));
    }
}

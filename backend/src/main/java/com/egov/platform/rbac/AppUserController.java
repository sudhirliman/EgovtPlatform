package com.egov.platform.rbac;

import com.egov.platform.rbac.dto.AssignRoleRequest;
import com.egov.platform.rbac.dto.CreateUserRequest;
import com.egov.platform.rbac.dto.UserRoleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
public class AppUserController {

    private final AppUserRepository appUserRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AppUserController(AppUserRepository appUserRepository, UserRoleRepository userRoleRepository,
                              RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/api/users")
    public List<AppUser> list() {
        return appUserRepository.findAll();
    }

    @PostMapping("/api/users")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'USER_MANAGE')")
    public AppUser create(@RequestBody CreateUserRequest request) {
        AppUser user = new AppUser();
        user.setName(request.name());
        user.setUsername(request.username());
        user.setMobile(request.mobile());
        user.setEmail(request.email());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return appUserRepository.save(user);
    }

    /** All users holding a given role - this is what powers the "eligible officer" dropdown. */
    @GetMapping("/api/users/by-role/{roleId}")
    public List<AppUser> byRole(@PathVariable UUID roleId) {
        return userRoleRepository.findByRoleId(roleId).stream().map(UserRole::getUser).distinct().toList();
    }

    // @Transactional: see RoleResponse's javadoc - UserRole.role.permissions is
    // lazy, and would throw LazyInitializationException at serialization time
    // (open-in-view=false) if we returned the raw entity graph instead of a DTO.
    @Transactional(readOnly = true)
    @GetMapping("/api/users/{userId}/roles")
    public List<UserRoleResponse> rolesFor(@PathVariable UUID userId) {
        return userRoleRepository.findByUserId(userId).stream().map(UserRoleResponse::from).toList();
    }

    @Transactional
    @PostMapping("/api/user-roles")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'USER_MANAGE')")
    public UserRoleResponse assignRole(@RequestBody AssignRoleRequest request) {
        AppUser user = appUserRepository.findById(request.userId())
                .orElseThrow(() -> new NoSuchElementException("User not found: " + request.userId()));
        Role role = roleRepository.findById(request.roleId())
                .orElseThrow(() -> new NoSuchElementException("Role not found: " + request.roleId()));

        UserRole userRole = new UserRole();
        userRole.setUser(user);
        userRole.setRole(role);
        userRole.setBoardId(request.boardId());
        userRole.setDepartmentId(request.departmentId());
        userRole.setServiceId(request.serviceId());
        return UserRoleResponse.from(userRoleRepository.save(userRole));
    }
}

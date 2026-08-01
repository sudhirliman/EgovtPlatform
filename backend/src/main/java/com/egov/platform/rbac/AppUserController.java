package com.egov.platform.rbac;

import com.egov.platform.rbac.dto.AssignRoleRequest;
import com.egov.platform.rbac.dto.CreateUserRequest;
import com.egov.platform.rbac.dto.UserRoleResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
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

    /** Safe projection — never exposes passwordHash. */
    public record UserView(UUID id, String name, String username, String mobile, String email,
                            boolean active, Instant createdAt) {
        static UserView from(AppUser u) {
            return new UserView(u.getId(), u.getName(), u.getUsername(), u.getMobile(),
                    u.getEmail(), u.isActive(), u.getCreatedAt());
        }
    }

    @GetMapping("/api/users")
    @PreAuthorize("hasPermission(null, 'USER_MANAGE')")
    public List<UserView> list() {
        return appUserRepository.findAll().stream().map(UserView::from).toList();
    }

    @PostMapping("/api/users")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasPermission(null, 'USER_MANAGE')")
    public UserView create(@Valid @RequestBody CreateUserRequest request) {
        AppUser user = new AppUser();
        user.setName(request.name());
        user.setUsername(request.username());
        user.setMobile(request.mobile());
        user.setEmail(request.email());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return UserView.from(appUserRepository.save(user));
    }

    /** All users holding a given role — powers the eligible-officer dropdown. */
    @GetMapping("/api/users/by-role/{roleId}")
    public List<UserView> byRole(@PathVariable UUID roleId) {
        return userRoleRepository.findByRoleId(roleId).stream()
                .map(UserRole::getUser)
                .distinct()
                .map(UserView::from)
                .toList();
    }

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

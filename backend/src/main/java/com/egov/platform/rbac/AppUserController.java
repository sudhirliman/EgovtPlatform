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
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    public record UserView(UUID id, String name, String firstName, String middleName, String lastName,
                            String username, String mobile, String email,
                            String employeeCode, String userType, boolean active, Instant createdAt) {
        static UserView from(AppUser u) {
            return new UserView(u.getId(), u.getName(), u.getFirstName(), u.getMiddleName(), u.getLastName(),
                    u.getUsername(), u.getMobile(), u.getEmail(),
                    u.getEmployeeCode(), u.getUserType(), u.isActive(), u.getCreatedAt());
        }
    }

    private void applyRequest(AppUser user, CreateUserRequest req) {
        user.setFirstName(req.firstName());
        user.setMiddleName(req.middleName());
        user.setLastName(req.lastName());
        // Derive display name from parts; fall back to req.name() for legacy clients
        String fullName = Stream.of(req.firstName(), req.middleName(), req.lastName())
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(" "));
        user.setName(fullName.isBlank() ? (req.name() != null ? req.name() : "") : fullName);
        if (req.username() != null && !req.username().isBlank()) user.setUsername(req.username());
        if (req.mobile() != null && !req.mobile().isBlank()) user.setMobile(req.mobile());
        user.setEmail(req.email());
        user.setEmployeeCode(req.employeeCode());
        if (req.userType() != null && !req.userType().isBlank()) user.setUserType(req.userType());
        if (req.password() != null && !req.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.password()));
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
        applyRequest(user, request);
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
    @PatchMapping("/api/users/{userId}/toggle-active")
    @PreAuthorize("hasPermission(null, 'USER_MANAGE')")
    public UserView toggleActive(@PathVariable UUID userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        user.setActive(!user.isActive());
        return UserView.from(appUserRepository.save(user));
    }

    @Transactional
    @PutMapping("/api/users/{userId}")
    @PreAuthorize("hasPermission(null, 'USER_MANAGE')")
    public UserView update(@PathVariable UUID userId, @RequestBody CreateUserRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        applyRequest(user, request);
        return UserView.from(appUserRepository.save(user));
    }

    @Transactional
    @DeleteMapping("/api/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasPermission(null, 'USER_MANAGE')")
    public void delete(@PathVariable UUID userId) {
        userRoleRepository.deleteAll(userRoleRepository.findByUserId(userId));
        appUserRepository.deleteById(userId);
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

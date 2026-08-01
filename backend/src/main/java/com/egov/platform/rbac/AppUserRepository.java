package com.egov.platform.rbac;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByMobile(String mobile);
    Optional<AppUser> findByUsername(String username);
    Optional<AppUser> findByUsernameOrMobile(String username, String mobile);
}

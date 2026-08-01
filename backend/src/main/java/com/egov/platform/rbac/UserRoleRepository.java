package com.egov.platform.rbac;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    List<UserRole> findByUserId(UUID userId);
    List<UserRole> findByRoleId(UUID roleId);

    @Query("SELECT COUNT(ur) > 0 FROM UserRole ur JOIN ur.role r WHERE ur.user.id = :userId AND r.name = :roleName")
    boolean existsByUserIdAndRoleName(@Param("userId") UUID userId, @Param("roleName") String roleName);

    @Query("SELECT COUNT(ur) > 0 FROM UserRole ur JOIN ur.role r WHERE ur.user.id = :userId AND r.name = :roleName AND ur.boardId = :boardId")
    boolean existsByUserIdAndRoleNameAndBoardId(@Param("userId") UUID userId, @Param("roleName") String roleName, @Param("boardId") UUID boardId);

    @Query("SELECT COUNT(ur) > 0 FROM UserRole ur JOIN ur.role r WHERE ur.user.id = :userId AND r.name = :roleName AND ur.boardId = :boardId AND (ur.departmentId = :deptId OR ur.departmentId IS NULL)")
    boolean existsByUserIdAndRoleNameAndBoardIdAndDeptId(@Param("userId") UUID userId, @Param("roleName") String roleName, @Param("boardId") UUID boardId, @Param("deptId") UUID deptId);

    @Query("SELECT DISTINCT ur.user FROM UserRole ur JOIN ur.role r WHERE r.name = :roleName AND ur.boardId = :boardId AND (ur.departmentId = :deptId OR ur.departmentId IS NULL)")
    List<AppUser> findUsersByRoleAndScope(@Param("roleName") String roleName, @Param("boardId") UUID boardId, @Param("deptId") UUID deptId);

    @Query("SELECT DISTINCT ur.boardId FROM UserRole ur JOIN ur.role r WHERE ur.user.id = :userId AND r.name = :roleName AND ur.boardId IS NOT NULL")
    List<UUID> findBoardIdsByUserIdAndRoleName(@Param("userId") UUID userId, @Param("roleName") String roleName);
}

package com.egov.platform.rbac.dto;

public record CreateUserRequest(String name, String username, String mobile, String email, String password) {}

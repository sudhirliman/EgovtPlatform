package com.egov.platform.rbac.dto;

public record CreateUserRequest(String name, String firstName, String middleName, String lastName,
                                String username, String mobile, String email,
                                String employeeCode, String userType, String password) {}

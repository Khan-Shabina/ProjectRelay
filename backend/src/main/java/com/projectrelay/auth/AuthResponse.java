
package com.projectrelay.auth;

public record AuthResponse(
        String token,
        Long id,
        String fullName,
        String email,
        String role
) {}

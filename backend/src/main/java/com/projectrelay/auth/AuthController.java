
package com.projectrelay.auth;

import com.projectrelay.security.JwtService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Value("${app.admin.setup-key:}")
    private String adminSetupKey;

    public AuthController(
            AppUserRepository repository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {

        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    // MANUAL FIRST ADMIN CREATION
    @PostMapping("/setup-admin")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, String> setupAdmin(
            @Valid @RequestBody AdminSetupRequest request,
            @RequestHeader("X-Admin-Setup-Key") String setupKey) {

        if (adminSetupKey == null || adminSetupKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin setup is not configured"
            );
        }

        boolean validKey = MessageDigest.isEqual(
                adminSetupKey.getBytes(StandardCharsets.UTF_8),
                setupKey.getBytes(StandardCharsets.UTF_8)
        );

        if (!validKey) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Invalid Admin setup key"
            );
        }

        if (repository.countByRole(UserRole.ADMIN) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Admin account has already been created"
            );
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (repository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered"
            );
        }

        AppUser admin = new AppUser();
        admin.setFullName(request.fullName().trim());
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(request.password()));
        admin.setRole(UserRole.ADMIN);

        repository.save(admin);

        return Map.of(
                "message",
                "Admin account created successfully. You can now log in."
        );
    }

    // TEAM MEMBER REGISTRATION
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
            @Valid @RequestBody RegisterRequest request) {

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (repository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email is already registered"
            );
        }

        AppUser user = new AppUser();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));

        // Public registration can only create Team Members.
        user.setRole(UserRole.TEAM_MEMBER);

        repository.save(user);

        return createAuthResponse(user);
    }

    // LOGIN FOR ADMIN AND TEAM MEMBERS
    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest request) {

        String email = request.email().trim().toLowerCase(Locale.ROOT);

        Authentication authentication =
                authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(
                                email,
                                request.password()
                        )
                );

        AppUser user = repository.findByEmail(
                authentication.getName()
        ).orElseThrow(() ->
                new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                )
        );

        return createAuthResponse(user);
    }

    // GET LOGGED-IN USER DETAILS
    @GetMapping("/me")
    public AuthResponse currentUser(Authentication authentication) {

        AppUser user = repository.findByEmail(
                authentication.getName()
        ).orElseThrow(() ->
                new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"
                )
        );

        return new AuthResponse(
                null,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    // GENERATE JWT RESPONSE
    private AuthResponse createAuthResponse(AppUser user) {

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}

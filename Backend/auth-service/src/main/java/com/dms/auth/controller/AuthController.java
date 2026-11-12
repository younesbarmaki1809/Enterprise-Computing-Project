package com.dms.auth.controller;

import com.dms.auth.model.User;
import com.dms.auth.security.JwtUtil;
import com.dms.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userService.findByEmail(request.email())
                .filter(user -> passwordEncoder.matches(request.password(), user.getPassword()))
                .map(user -> {
                    // Update last login timestamp
                    userService.updateLastLogin(user);
                    
                    String token = jwtUtil.generateToken(user.getEmail(), user.getRoles());
                    return ResponseEntity.ok(Map.of(
                            "token", token,
                            "email", user.getEmail(),
                            "roles", user.getRoles()
                    ));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid email or password")));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User newUser = userService.registerUser(request.email(), request.password(), request.roles());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "User registered successfully",
                    "email", newUser.getEmail()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Simple request body for login — uses a Java record.
     */
    public record LoginRequest(String email, String password) {}
    
    public record RegisterRequest(String email, String password, List<String> roles) {}
}

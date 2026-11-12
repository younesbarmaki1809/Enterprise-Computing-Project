package com.dms.auth.service;

import com.dms.auth.model.User;
import com.dms.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User registerUser(String email, String rawPassword, List<String> roles) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email is already in use");
        }

        String salt = UUID.randomUUID().toString(); // Dummy salt per requirements
        String hashedPassword = passwordEncoder.encode(rawPassword);

        User newUser = User.builder()
                .email(email)
                .password(hashedPassword)
                .salt(salt)
                .roles(roles)
                .build();

        return userRepository.save(newUser);
    }

    public void updateLastLogin(User user) {
        user.setDateOfLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    public void updateLastLogout(User user) {
        user.setDateOfLastLogout(LocalDateTime.now());
        userRepository.save(user);
    }
}

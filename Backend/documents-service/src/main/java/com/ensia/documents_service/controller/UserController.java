package com.ensia.documents_service.controller;

import com.ensia.documents_service.model.User;
import com.ensia.documents_service.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserRepository repository;

    public UserController(UserRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<User>> listUsers(
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "password", required = false) String password,
            @RequestParam(name = "_page", required = false) Integer page,
            @RequestParam(name = "_per_page", required = false) Integer perPage) {
        List<User> users;

        if (email != null && password != null) {
            users = repository.findByEmailAndPassword(email, password);
        } else {
            users = new ArrayList<>(repository.findAll());
        }

        int total = users.size();
        if (page != null && perPage != null && perPage > 0) {
            int fromIndex = Math.min(Math.max(page - 1, 0) * perPage, total);
            int toIndex = Math.min(fromIndex + perPage, total);
            users = users.subList(fromIndex, toIndex);
        }

        return ResponseEntity.ok()
                .header("X-Total-Count", String.valueOf(total))
                .body(users);
    }

    @PostMapping
    public User createUser(@RequestBody User user) {
        return repository.save(user);
    }

    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("User not found with id: " + id);
        }

        user.setId(id);
        return repository.save(user);
    }

    @PatchMapping("/{id}")
    public User patchUser(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        User user = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + id));

        if (payload.containsKey("name")) {
            user.setName((String) payload.get("name"));
        }
        if (payload.containsKey("email")) {
            user.setEmail((String) payload.get("email"));
        }
        if (payload.containsKey("password")) {
            user.setPassword((String) payload.get("password"));
        }
        if (payload.containsKey("role")) {
            user.setRole((String) payload.get("role"));
        }
        if (payload.containsKey("departmentId")) {
            user.setDepartmentId(asLong(payload.get("departmentId")));
        }
        if (payload.containsKey("status")) {
            user.setStatus((String) payload.get("status"));
        }
        if (payload.containsKey("avatarUrl")) {
            user.setAvatarUrl((String) payload.get("avatarUrl"));
        }

        return repository.save(user);
    }

    private Long asLong(Object value) {
        if (value == null) {
            return null;
        }

        if (value instanceof Number number) {
            return number.longValue();
        }

        return Long.parseLong(String.valueOf(value));
    }
}

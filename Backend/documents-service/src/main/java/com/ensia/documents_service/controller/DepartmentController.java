package com.ensia.documents_service.controller;

import com.ensia.documents_service.model.Department;
import com.ensia.documents_service.repository.DepartmentRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/departments")
public class DepartmentController {

    private final DepartmentRepository repository;

    public DepartmentController(DepartmentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Department> listDepartments() {
        return repository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Department createDepartment(@RequestBody Department department) {
        return repository.save(department);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Department updateDepartment(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Department department = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Department not found with id: " + id));

        if (payload.containsKey("name")) {
            department.setName((String) payload.get("name"));
        }
        if (payload.containsKey("description")) {
            department.setDescription((String) payload.get("description"));
        }
        if (payload.containsKey("memberIds")) {
            Object members = payload.get("memberIds");
            if (members instanceof List<?> list) {
                department.setMemberIds(list.stream().map(item -> Long.parseLong(String.valueOf(item))).toList());
            }
        }

        return repository.save(department);
    }

    /**
     * Assign a user to a department. Admin-only.
     */
    @PostMapping("/{id}/members/{userId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Department> addMember(@PathVariable Long id, @PathVariable Long userId) {
        Department department = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Department not found with id: " + id));

        List<Long> members = new ArrayList<>(department.getMemberIds());
        if (!members.contains(userId)) {
            members.add(userId);
            department.setMemberIds(members);
            repository.save(department);
        }

        return ResponseEntity.ok(department);
    }

    /**
     * Remove a user from a department. Admin-only.
     */
    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Department> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        Department department = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Department not found with id: " + id));

        List<Long> members = new ArrayList<>(department.getMemberIds());
        members.remove(userId);
        department.setMemberIds(members);
        repository.save(department);

        return ResponseEntity.ok(department);
    }
}

package com.ensia.documents_service.controller;

import com.ensia.documents_service.model.Department;
import com.ensia.documents_service.repository.DepartmentRepository;
import org.springframework.web.bind.annotation.*;

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
    public Department createDepartment(@RequestBody Department department) {
        return repository.save(department);
    }

    @PatchMapping("/{id}")
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
}

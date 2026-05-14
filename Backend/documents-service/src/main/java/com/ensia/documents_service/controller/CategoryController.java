package com.ensia.documents_service.controller;

import com.ensia.documents_service.model.Category;
import com.ensia.documents_service.repository.CategoryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryRepository repository;

    public CategoryController(CategoryRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Category> listCategories() {
        return repository.findAll();
    }

    @PostMapping
    public Category createCategory(@RequestBody Category category) {
        return repository.save(category);
    }

    @PatchMapping("/{id}")
    public Category updateCategory(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Category category = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Category not found with id: " + id));

        if (payload.containsKey("name")) {
            category.setName((String) payload.get("name"));
        }
        if (payload.containsKey("color")) {
            category.setColor((String) payload.get("color"));
        }
        if (payload.containsKey("description")) {
            category.setDescription((String) payload.get("description"));
        }

        return repository.save(category);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            throw new NoSuchElementException("Category not found with id: " + id);
        }

        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

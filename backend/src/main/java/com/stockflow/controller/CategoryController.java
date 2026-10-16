package com.stockflow.controller;

import com.stockflow.dto.CategoryRequest;
import com.stockflow.entity.Category;
import com.stockflow.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Category Management", description = "Endpoints for organizing products into categories")
@SecurityRequirement(name = "bearerAuth")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Get all categories")
    public ResponseEntity<List<Category>> getAllCategories(@RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(activeOnly ? categoryService.getActiveCategories() : categoryService.getAllCategories());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get category details by ID")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Create a new category (Admin or Inventory Manager)")
    public ResponseEntity<Category> createCategory(@Valid @RequestBody CategoryRequest request) {
        Category created = categoryService.createCategory(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Update category (Admin or Inventory Manager)")
    public ResponseEntity<Category> updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle category active status (Admin only)")
    public ResponseEntity<Void> toggleActive(@PathVariable Long id) {
        categoryService.toggleActiveStatus(id);
        return ResponseEntity.noContent().build();
    }
}

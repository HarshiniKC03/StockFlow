package com.stockflow.service;

import com.stockflow.dto.CategoryRequest;
import com.stockflow.entity.Category;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final AuditLogService auditLogService;

    public CategoryService(CategoryRepository categoryRepository, AuditLogService auditLogService) {
        this.categoryRepository = categoryRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Category> getActiveCategories() {
        return categoryRepository.findByActiveTrueOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + id));
    }

    @Transactional
    public Category createCategory(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Category already exists with name: " + request.getName());
        }

        Category category = new Category(request.getName().trim(), request.getDescription());
        Category saved = categoryRepository.save(category);

        auditLogService.logAction("CREATE_CATEGORY", "Category", saved.getId(),
            null, saved.getName(), "Created category: " + saved.getName());

        return saved;
    }

    @Transactional
    public Category updateCategory(Long id, CategoryRequest request) {
        Category category = getCategoryById(id);

        if (!category.getName().equalsIgnoreCase(request.getName().trim()) &&
            categoryRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Category already exists with name: " + request.getName());
        }

        String oldVal = category.getName() + " (" + category.getDescription() + ")";
        category.setName(request.getName().trim());
        category.setDescription(request.getDescription());
        Category updated = categoryRepository.save(category);

        auditLogService.logAction("UPDATE_CATEGORY", "Category", updated.getId(),
            oldVal, updated.getName() + " (" + updated.getDescription() + ")", "Updated category details");

        return updated;
    }

    @Transactional
    public void toggleActiveStatus(Long id) {
        Category category = getCategoryById(id);
        boolean prev = category.isActive();
        category.setActive(!prev);
        categoryRepository.save(category);

        auditLogService.logAction("TOGGLE_CATEGORY_STATUS", "Category", category.getId(),
            String.valueOf(prev), String.valueOf(!prev), "Changed active status");
    }
}

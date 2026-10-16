package com.stockflow.service;

import com.stockflow.dto.ProductRequest;
import com.stockflow.dto.ProductResponse;
import com.stockflow.entity.Category;
import com.stockflow.entity.Inventory;
import com.stockflow.entity.Product;
import com.stockflow.entity.Supplier;
import com.stockflow.exception.BadRequestException;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final AuditLogService auditLogService;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          SupplierRepository supplierRepository,
                          InventoryRepository inventoryRepository,
                          OrderItemRepository orderItemRepository,
                          AuditLogService auditLogService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderItemRepository = orderItemRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts(String query, Long categoryId, Boolean activeOnly) {
        boolean filterActive = activeOnly != null && activeOnly;
        List<Product> products = productRepository.searchProducts(
            query != null && !query.isBlank() ? query.trim() : null,
            categoryId,
            filterActive
        );

        return products.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Product getProductEntityById(Long id) {
        return productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = getProductEntityById(id);
        return mapToResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        validateProductPrice(request.getUnitPrice());

        String sku = request.getSku().trim().toUpperCase();
        if (productRepository.existsBySkuIgnoreCase(sku)) {
            throw new DuplicateResourceException("Product with SKU '" + sku + "' already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));

        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + request.getSupplierId()));
        }

        Product product = new Product(
            request.getName().trim(),
            sku,
            request.getDescription(),
            request.getUnitPrice(),
            request.getMinimumStock(),
            category,
            supplier
        );

        Product saved = productRepository.save(product);

        auditLogService.logAction("CREATE_PRODUCT", "Product", saved.getId(),
            null, saved.getSku() + " - " + saved.getName(), "Created product with price ₹" + saved.getUnitPrice());

        return mapToResponse(saved);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = getProductEntityById(id);
        validateProductPrice(request.getUnitPrice());

        String sku = request.getSku().trim().toUpperCase();
        if (!product.getSku().equalsIgnoreCase(sku) && productRepository.existsBySkuIgnoreCase(sku)) {
            throw new DuplicateResourceException("Product with SKU '" + sku + "' already exists");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
            .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryId()));

        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + request.getSupplierId()));
        }

        String oldVal = product.getSku() + " (" + product.getName() + ", ₹" + product.getUnitPrice() + ")";
        product.setName(request.getName().trim());
        product.setSku(sku);
        product.setDescription(request.getDescription());
        product.setUnitPrice(request.getUnitPrice());
        product.setMinimumStock(request.getMinimumStock());
        product.setCategory(category);
        product.setSupplier(supplier);
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        Product updated = productRepository.save(product);

        auditLogService.logAction("UPDATE_PRODUCT", "Product", updated.getId(),
            oldVal, updated.getSku() + " (" + updated.getName() + ", ₹" + updated.getUnitPrice() + ")", "Updated product details");

        return mapToResponse(updated);
    }

    @Transactional
    public void deleteOrDeactivateProduct(Long id) {
        Product product = getProductEntityById(id);

        boolean hasOrderHistory = orderItemRepository.existsByProductId(id);
        if (hasOrderHistory) {
            // Enterprise standard: never break historical order integrity! Deactivate instead.
            product.setActive(false);
            productRepository.save(product);
            auditLogService.logAction("DEACTIVATE_PRODUCT", "Product", product.getId(),
                "Active: true", "Active: false", "Product has historical order references, deactivated instead of deleted");
        } else {
            productRepository.delete(product);
            auditLogService.logAction("DELETE_PRODUCT", "Product", id,
                product.getSku(), null, "Permanently deleted unreferenced product");
        }
    }

    public void validateProductPrice(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Product price must be strictly positive and greater than zero");
        }
    }

    public ProductResponse mapToResponse(Product product) {
        ProductResponse res = new ProductResponse();
        res.setId(product.getId());
        res.setName(product.getName());
        res.setSku(product.getSku());
        res.setDescription(product.getDescription());
        res.setUnitPrice(product.getUnitPrice());
        res.setMinimumStock(product.getMinimumStock());
        res.setActive(product.isActive());

        if (product.getCategory() != null) {
            res.setCategoryId(product.getCategory().getId());
            res.setCategoryName(product.getCategory().getName());
        }

        if (product.getSupplier() != null) {
            res.setSupplierId(product.getSupplier().getId());
            res.setSupplierName(product.getSupplier().getName());
        }

        List<Inventory> inventories = inventoryRepository.findByProductId(product.getId());
        int totalStock = inventories.stream().mapToInt(Inventory::getQuantityAvailable).sum();
        res.setTotalStock(totalStock);

        res.setCreatedAt(product.getCreatedAt());
        res.setUpdatedAt(product.getUpdatedAt());
        return res;
    }
}

package com.stockflow.service;

import com.stockflow.dto.ProductRequest;
import com.stockflow.dto.ProductResponse;
import com.stockflow.entity.Category;
import com.stockflow.entity.Product;
import com.stockflow.exception.BadRequestException;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.repository.CategoryRepository;
import com.stockflow.repository.InventoryRepository;
import com.stockflow.repository.OrderItemRepository;
import com.stockflow.repository.ProductRepository;
import com.stockflow.repository.SupplierRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ProductService productService;

    private Category sampleCategory;

    @BeforeEach
    void setUp() {
        sampleCategory = new Category("Electronics", "Electronic Devices");
        sampleCategory.setId(1L);
    }

    @Test
    @DisplayName("Should reject product creation when price is negative")
    void shouldRejectNegativePrice() {
        ProductRequest request = new ProductRequest(
            "Test Laptop", "LAP-TEST", "Description",
            new BigDecimal("-100.00"), 10, 1L, null
        );

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            productService.createProduct(request);
        });

        assertTrue(ex.getMessage().contains("must be strictly positive"));
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject product creation when price is zero")
    void shouldRejectZeroPrice() {
        ProductRequest request = new ProductRequest(
            "Free Item", "FREE-001", "Description",
            BigDecimal.ZERO, 10, 1L, null
        );

        assertThrows(BadRequestException.class, () -> {
            productService.createProduct(request);
        });

        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject product creation with duplicate SKU")
    void shouldRejectDuplicateSku() {
        ProductRequest request = new ProductRequest(
            "Duplicate SKU Laptop", "LAP-1001", "Description",
            new BigDecimal("50000.00"), 10, 1L, null
        );

        when(productRepository.existsBySkuIgnoreCase("LAP-1001")).thenReturn(true);

        DuplicateResourceException ex = assertThrows(DuplicateResourceException.class, () -> {
            productService.createProduct(request);
        });

        assertTrue(ex.getMessage().contains("already exists"));
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should create product successfully with valid details")
    void shouldCreateProductSuccessfully() {
        ProductRequest request = new ProductRequest(
            "New Gaming Laptop", "LAP-9999", "High-end laptop",
            new BigDecimal("75000.00"), 5, 1L, null
        );

        Product savedProduct = new Product(
            request.getName(), request.getSku(), request.getDescription(),
            request.getUnitPrice(), request.getMinimumStock(), sampleCategory, null
        );
        savedProduct.setId(99L);

        when(productRepository.existsBySkuIgnoreCase("LAP-9999")).thenReturn(false);
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(productRepository.save(any(Product.class))).thenReturn(savedProduct);

        ProductResponse response = productService.createProduct(request);

        assertNotNull(response);
        assertEquals("LAP-9999", response.getSku());
        assertEquals(new BigDecimal("75000.00"), response.getUnitPrice());
        assertEquals("Electronics", response.getCategoryName());
        verify(auditLogService, times(1)).logAction(any(), any(), any(), any(), any(), any());
    }
}

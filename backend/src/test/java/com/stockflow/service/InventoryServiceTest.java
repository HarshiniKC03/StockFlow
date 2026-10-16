package com.stockflow.service;

import com.stockflow.dto.StockAdjustmentRequest;
import com.stockflow.entity.Inventory;
import com.stockflow.entity.Product;
import com.stockflow.entity.Warehouse;
import com.stockflow.exception.BadRequestException;
import com.stockflow.exception.InsufficientStockException;
import com.stockflow.repository.*;
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
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private InventoryMovementRepository movementRepository;

    @Mock
    private StockReceiptRepository stockReceiptRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private InventoryService inventoryService;

    private Product sampleProduct;
    private Warehouse sampleWarehouse;
    private Inventory sampleInventory;

    @BeforeEach
    void setUp() {
        sampleProduct = new Product("Mechanical Keyboard", "KB-100", "Description", new BigDecimal("2000.00"), 10, null, null);
        sampleProduct.setId(10L);

        sampleWarehouse = new Warehouse("Main Warehouse", "WH-MAIN", "Delhi", "+91-1122334455");
        sampleWarehouse.setId(20L);

        sampleInventory = new Inventory(sampleProduct, sampleWarehouse, 50);
        sampleInventory.setId(30L);
    }

    @Test
    @DisplayName("Should reject invalid stock adjustment when quantity is zero")
    void shouldRejectZeroStockAdjustment() {
        StockAdjustmentRequest request = new StockAdjustmentRequest(10L, 20L, 0, "Test adjust");

        assertThrows(BadRequestException.class, () -> {
            inventoryService.adjustStock(request);
        });
    }

    @Test
    @DisplayName("Should reject stock adjustment that causes negative inventory balance")
    void shouldRejectStockAdjustmentResultingInNegativeBalance() {
        StockAdjustmentRequest request = new StockAdjustmentRequest(10L, 20L, -60, "Write-off damaged units");

        when(productRepository.findById(10L)).thenReturn(Optional.of(sampleProduct));
        when(warehouseRepository.findById(20L)).thenReturn(Optional.of(sampleWarehouse));
        when(inventoryRepository.findByProductIdAndWarehouseIdForUpdate(10L, 20L)).thenReturn(Optional.of(sampleInventory));

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            inventoryService.adjustStock(request);
        });

        assertTrue(ex.getMessage().contains("cause inventory to become negative"));
    }

    @Test
    @DisplayName("Should prevent overselling by throwing InsufficientStockException when stock is inadequate")
    void shouldThrowInsufficientStockWhenStockIsExceeded() {
        when(inventoryRepository.findByProductIdAndWarehouseIdForUpdate(10L, 20L)).thenReturn(Optional.of(sampleInventory));

        InsufficientStockException ex = assertThrows(InsufficientStockException.class, () -> {
            inventoryService.deductStockForOrder(10L, 20L, 100, "ORD-999");
        });

        assertTrue(ex.getMessage().contains("Overselling prevented"));
    }

    @Test
    @DisplayName("Should deduct stock and record movement successfully when stock is available")
    void shouldDeductStockSuccessfully() {
        when(inventoryRepository.findByProductIdAndWarehouseIdForUpdate(10L, 20L)).thenReturn(Optional.of(sampleInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

        Inventory updated = inventoryService.deductStockForOrder(10L, 20L, 10, "ORD-999");

        assertEquals(40, updated.getQuantityAvailable());
        verify(movementRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Should restore stock and record movement when order cancellation is processed")
    void shouldRestoreStockOnCancellation() {
        when(inventoryRepository.findByProductIdAndWarehouseIdForUpdate(10L, 20L)).thenReturn(Optional.of(sampleInventory));
        when(inventoryRepository.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

        Inventory updated = inventoryService.restoreStockForCancellation(10L, 20L, 10, "ORD-999", "Customer requested cancellation");

        assertEquals(60, updated.getQuantityAvailable());
        verify(movementRepository, times(1)).save(any());
    }
}

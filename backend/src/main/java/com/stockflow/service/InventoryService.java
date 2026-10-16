package com.stockflow.service;

import com.stockflow.dto.InventoryResponse;
import com.stockflow.dto.StockAdjustmentRequest;
import com.stockflow.dto.StockReceiptItemRequest;
import com.stockflow.dto.StockReceiptRequest;
import com.stockflow.entity.*;
import com.stockflow.entity.enums.MovementType;
import com.stockflow.exception.BadRequestException;
import com.stockflow.exception.InsufficientStockException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final SupplierRepository supplierRepository;
    private final InventoryMovementRepository movementRepository;
    private final StockReceiptRepository stockReceiptRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public InventoryService(InventoryRepository inventoryRepository,
                            ProductRepository productRepository,
                            WarehouseRepository warehouseRepository,
                            SupplierRepository supplierRepository,
                            InventoryMovementRepository movementRepository,
                            StockReceiptRepository stockReceiptRepository,
                            UserRepository userRepository,
                            AuditLogService auditLogService,
                            NotificationService notificationService) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.supplierRepository = supplierRepository;
        this.movementRepository = movementRepository;
        this.stockReceiptRepository = stockReceiptRepository;
        this.userRepository = userRepository;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getInventory(Long warehouseId) {
        List<Inventory> list = warehouseId != null
            ? inventoryRepository.findByWarehouseId(warehouseId)
            : inventoryRepository.findAll();

        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InventoryResponse> getLowStockAlerts() {
        return inventoryRepository.findLowStockInventories().stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InventoryMovement> getMovements(Long productId, Long warehouseId, MovementType type) {
        return movementRepository.filterMovements(productId, warehouseId, type);
    }

    /**
     * Executes stock deduction with Pessimistic Locking to eliminate race conditions
     * and prevent overselling during high concurrent order loads.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Inventory deductStockForOrder(Long productId, Long warehouseId, int quantity, String orderNumber) {
        if (quantity <= 0) {
            throw new BadRequestException("Deduction quantity must be strictly positive");
        }

        // Lock row exclusively for update
        Inventory inventory = inventoryRepository.findByProductIdAndWarehouseIdForUpdate(productId, warehouseId)
            .orElseThrow(() -> new ResourceNotFoundException("No inventory record found for product ID " + productId + " at warehouse ID " + warehouseId));

        if (inventory.getQuantityAvailable() < quantity) {
            throw new InsufficientStockException(
                "Overselling prevented: Requested " + quantity + " units of '" +
                inventory.getProduct().getName() + "' (SKU: " + inventory.getProduct().getSku() +
                "), but only " + inventory.getQuantityAvailable() + " units are available in warehouse '" +
                inventory.getWarehouse().getName() + "'"
            );
        }

        int previousQty = inventory.getQuantityAvailable();
        int newQty = previousQty - quantity;
        inventory.setQuantityAvailable(newQty);
        Inventory saved = inventoryRepository.save(inventory);

        // Record stock movement
        recordMovement(saved.getProduct(), saved.getWarehouse(), MovementType.ORDER_CONFIRMATION,
            -quantity, newQty, orderNumber, "Order confirmation stock allocation", getCurrentUser());

        // Check and notify if low stock threshold breached
        if (saved.isLowStock()) {
            notificationService.notify(
                "Low Stock Alert: " + saved.getProduct().getName(),
                "Stock for " + saved.getProduct().getName() + " (" + saved.getProduct().getSku() +
                ") dropped to " + newQty + " units at " + saved.getWarehouse().getName() +
                " (Minimum threshold: " + saved.getProduct().getMinimumStock() + ")",
                "LOW_STOCK"
            );
        }

        return saved;
    }

    /**
     * Restores stock when an eligible order is cancelled.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Inventory restoreStockForCancellation(Long productId, Long warehouseId, int quantity, String orderNumber, String reason) {
        Inventory inventory = inventoryRepository.findByProductIdAndWarehouseIdForUpdate(productId, warehouseId)
            .orElseThrow(() -> new ResourceNotFoundException("No inventory record found for product ID " + productId + " at warehouse ID " + warehouseId));

        int previousQty = inventory.getQuantityAvailable();
        int newQty = previousQty + quantity;
        inventory.setQuantityAvailable(newQty);
        Inventory saved = inventoryRepository.save(inventory);

        recordMovement(saved.getProduct(), saved.getWarehouse(), MovementType.ORDER_CANCELLATION,
            +quantity, newQty, orderNumber, "Cancelled order return: " + reason, getCurrentUser());

        return saved;
    }

    /**
     * Records incoming delivery from a supplier.
     */
    @Transactional
    public StockReceipt recordStockReceipt(StockReceiptRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
            .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + request.getSupplierId()));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
            .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + request.getWarehouseId()));

        User currentUser = getCurrentUser();
        String receiptNumber = "REC-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        StockReceipt receipt = new StockReceipt(receiptNumber, supplier, warehouse, request.getNotes(), currentUser);

        for (StockReceiptItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemReq.getProductId()));

            StockReceiptItem item = new StockReceiptItem(receipt, product, itemReq.getQuantity(), itemReq.getUnitCost());
            receipt.addItem(item);

            // Update inventory
            Inventory inventory = inventoryRepository.findByProductIdAndWarehouseIdForUpdate(product.getId(), warehouse.getId())
                .orElseGet(() -> new Inventory(product, warehouse, 0));

            int prevQty = inventory.getQuantityAvailable();
            int newQty = prevQty + itemReq.getQuantity();
            inventory.setQuantityAvailable(newQty);
            inventoryRepository.save(inventory);

            // Record movement
            recordMovement(product, warehouse, MovementType.SUPPLIER_RECEIPT,
                itemReq.getQuantity(), newQty, receiptNumber, "Supplier delivery receipt from " + supplier.getName(), currentUser);
        }

        StockReceipt savedReceipt = stockReceiptRepository.save(receipt);

        auditLogService.logAction("STOCK_RECEIPT", "StockReceipt", savedReceipt.getId(),
            null, receiptNumber, "Received incoming stock from supplier " + supplier.getName() + " into " + warehouse.getName());

        notificationService.notify(
            "Stock Delivery Received: " + receiptNumber,
            "Received incoming delivery of " + request.getItems().size() + " product lines from " + supplier.getName() + " into " + warehouse.getName(),
            "SUPPLIER_RECEIPT"
        );

        return savedReceipt;
    }

    /**
     * Records an approved stock adjustment (e.g. damaged goods write-off or recount).
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public InventoryResponse adjustStock(StockAdjustmentRequest request) {
        if (request.getAdjustmentQuantity() == 0) {
            throw new BadRequestException("Adjustment quantity cannot be 0");
        }

        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + request.getProductId()));

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
            .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + request.getWarehouseId()));

        Inventory inventory = inventoryRepository.findByProductIdAndWarehouseIdForUpdate(product.getId(), warehouse.getId())
            .orElseGet(() -> new Inventory(product, warehouse, 0));

        int prevQty = inventory.getQuantityAvailable();
        int newQty = prevQty + request.getAdjustmentQuantity();

        if (newQty < 0) {
            throw new BadRequestException("Adjustment would cause inventory to become negative (" + newQty + ")");
        }

        inventory.setQuantityAvailable(newQty);
        Inventory saved = inventoryRepository.save(inventory);

        User currentUser = getCurrentUser();
        recordMovement(product, warehouse, MovementType.APPROVED_ADJUSTMENT,
            request.getAdjustmentQuantity(), newQty, "ADJ-" + System.currentTimeMillis(),
            request.getReason(), currentUser);

        auditLogService.logAction("INVENTORY_ADJUSTMENT", "Inventory", saved.getId(),
            String.valueOf(prevQty), String.valueOf(newQty),
            "Adjusted stock by " + (request.getAdjustmentQuantity() > 0 ? "+" : "") + request.getAdjustmentQuantity() +
            ". Reason: " + request.getReason());

        if (saved.isLowStock()) {
            notificationService.notify(
                "Low Stock Alert: " + product.getName(),
                "Stock for " + product.getName() + " adjusted to " + newQty + " units (Low stock threshold: " + product.getMinimumStock() + ")",
                "LOW_STOCK"
            );
        }

        return mapToResponse(saved);
    }

    /**
     * Transfers stock between two warehouses atomically.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void transferStock(Long productId, Long sourceWarehouseId, Long targetWarehouseId, int quantity, String notes) {
        if (quantity <= 0) {
            throw new BadRequestException("Transfer quantity must be positive");
        }
        if (sourceWarehouseId.equals(targetWarehouseId)) {
            throw new BadRequestException("Source and target warehouse cannot be the same");
        }

        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + productId));

        Warehouse source = warehouseRepository.findById(sourceWarehouseId)
            .orElseThrow(() -> new ResourceNotFoundException("Source warehouse not found"));
        Warehouse target = warehouseRepository.findById(targetWarehouseId)
            .orElseThrow(() -> new ResourceNotFoundException("Target warehouse not found"));

        Inventory srcInv = inventoryRepository.findByProductIdAndWarehouseIdForUpdate(productId, sourceWarehouseId)
            .orElseThrow(() -> new ResourceNotFoundException("No inventory found at source warehouse"));

        if (srcInv.getQuantityAvailable() < quantity) {
            throw new InsufficientStockException("Insufficient stock at source warehouse: Available " + srcInv.getQuantityAvailable() + ", requested " + quantity);
        }

        Inventory tgtInv = inventoryRepository.findByProductIdAndWarehouseIdForUpdate(productId, targetWarehouseId)
            .orElseGet(() -> new Inventory(product, target, 0));

        // Deduct from source
        int srcPrev = srcInv.getQuantityAvailable();
        int srcNew = srcPrev - quantity;
        srcInv.setQuantityAvailable(srcNew);
        inventoryRepository.save(srcInv);

        // Add to target
        int tgtPrev = tgtInv.getQuantityAvailable();
        int tgtNew = tgtPrev + quantity;
        tgtInv.setQuantityAvailable(tgtNew);
        inventoryRepository.save(tgtInv);

        String transferRef = "TRF-" + System.currentTimeMillis();
        User user = getCurrentUser();

        recordMovement(product, source, MovementType.WAREHOUSE_TRANSFER,
            -quantity, srcNew, transferRef, "Transfer out to " + target.getName() + (notes != null ? " (" + notes + ")" : ""), user);

        recordMovement(product, target, MovementType.WAREHOUSE_TRANSFER,
            +quantity, tgtNew, transferRef, "Transfer in from " + source.getName() + (notes != null ? " (" + notes + ")" : ""), user);

        auditLogService.logAction("TRANSFER_STOCK", "Inventory", srcInv.getId(),
            source.getName() + " -> " + target.getName(), String.valueOf(quantity),
            "Transferred " + quantity + " units of " + product.getSku());
    }

    private void recordMovement(Product product, Warehouse warehouse, MovementType type,
                                int quantityChange, int resultingQuantity, String reference,
                                String reason, User user) {
        InventoryMovement movement = new InventoryMovement(
            product, warehouse, type, quantityChange, resultingQuantity, reference, reason, user
        );
        movementRepository.save(movement);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return userRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    public InventoryResponse mapToResponse(Inventory inv) {
        InventoryResponse res = new InventoryResponse();
        res.setId(inv.getId());
        res.setProductId(inv.getProduct().getId());
        res.setProductName(inv.getProduct().getName());
        res.setSku(inv.getProduct().getSku());
        res.setCategoryName(inv.getProduct().getCategory() != null ? inv.getProduct().getCategory().getName() : "");
        res.setUnitPrice(inv.getProduct().getUnitPrice());
        res.setWarehouseId(inv.getWarehouse().getId());
        res.setWarehouseName(inv.getWarehouse().getName());
        res.setWarehouseCode(inv.getWarehouse().getCode());
        res.setQuantityAvailable(inv.getQuantityAvailable());
        res.setMinimumStock(inv.getProduct().getMinimumStock());
        res.setLowStock(inv.isLowStock());
        res.setLastUpdated(inv.getLastUpdated());
        return res;
    }
}

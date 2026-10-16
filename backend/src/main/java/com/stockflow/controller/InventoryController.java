package com.stockflow.controller;

import com.stockflow.dto.InventoryResponse;
import com.stockflow.dto.StockAdjustmentRequest;
import com.stockflow.dto.StockReceiptRequest;
import com.stockflow.entity.InventoryMovement;
import com.stockflow.entity.StockReceipt;
import com.stockflow.entity.enums.MovementType;
import com.stockflow.service.InventoryService;
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
@RequestMapping("/api/inventory")
@Tag(name = "Inventory Management", description = "Operations for real-time stock levels, receipts, adjustments, movements, and transfers")
@SecurityRequirement(name = "bearerAuth")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    @Operation(summary = "View current stock levels by warehouse or across all warehouses")
    public ResponseEntity<List<InventoryResponse>> getInventory(@RequestParam(required = false) Long warehouseId) {
        return ResponseEntity.ok(inventoryService.getInventory(warehouseId));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Retrieve products with stock at or below minimum threshold")
    public ResponseEntity<List<InventoryResponse>> getLowStockAlerts() {
        return ResponseEntity.ok(inventoryService.getLowStockAlerts());
    }

    @GetMapping("/movements")
    @Operation(summary = "View inventory movement history with filtering")
    public ResponseEntity<List<InventoryMovement>> getMovements(
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) MovementType type) {
        return ResponseEntity.ok(inventoryService.getMovements(productId, warehouseId, type));
    }

    @PostMapping("/receipts")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Record incoming stock delivery from supplier (Admin or Inventory Manager)")
    public ResponseEntity<StockReceipt> recordStockReceipt(@Valid @RequestBody StockReceiptRequest request) {
        StockReceipt receipt = inventoryService.recordStockReceipt(request);
        return new ResponseEntity<>(receipt, HttpStatus.CREATED);
    }

    @PostMapping("/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Record approved stock adjustment with mandatory audit reason (Admin or Inventory Manager)")
    public ResponseEntity<InventoryResponse> adjustStock(@Valid @RequestBody StockAdjustmentRequest request) {
        return ResponseEntity.ok(inventoryService.adjustStock(request));
    }

    @PostMapping("/transfer")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Transfer stock atomically between two warehouses (Admin or Inventory Manager)")
    public ResponseEntity<Void> transferStock(
            @RequestParam Long productId,
            @RequestParam Long sourceWarehouseId,
            @RequestParam Long targetWarehouseId,
            @RequestParam int quantity,
            @RequestParam(required = false) String notes) {
        inventoryService.transferStock(productId, sourceWarehouseId, targetWarehouseId, quantity, notes);
        return ResponseEntity.ok().build();
    }
}

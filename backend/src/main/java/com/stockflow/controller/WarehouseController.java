package com.stockflow.controller;

import com.stockflow.dto.WarehouseRequest;
import com.stockflow.entity.Warehouse;
import com.stockflow.service.WarehouseService;
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
@RequestMapping("/api/warehouses")
@Tag(name = "Warehouse Management", description = "Endpoints for managing distribution hubs and warehouse facilities")
@SecurityRequirement(name = "bearerAuth")
public class WarehouseController {

    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping
    @Operation(summary = "Get all warehouses")
    public ResponseEntity<List<Warehouse>> getAllWarehouses(@RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(activeOnly ? warehouseService.getActiveWarehouses() : warehouseService.getAllWarehouses());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get warehouse details by ID")
    public ResponseEntity<Warehouse> getWarehouseById(@PathVariable Long id) {
        return ResponseEntity.ok(warehouseService.getWarehouseById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register a new warehouse facility (Admin only)")
    public ResponseEntity<Warehouse> createWarehouse(@Valid @RequestBody WarehouseRequest request) {
        Warehouse created = warehouseService.createWarehouse(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update warehouse details (Admin only)")
    public ResponseEntity<Warehouse> updateWarehouse(@PathVariable Long id, @Valid @RequestBody WarehouseRequest request) {
        return ResponseEntity.ok(warehouseService.updateWarehouse(id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle warehouse active status (Admin only)")
    public ResponseEntity<Void> toggleActive(@PathVariable Long id) {
        warehouseService.toggleActiveStatus(id);
        return ResponseEntity.noContent().build();
    }
}

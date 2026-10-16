package com.stockflow.controller;

import com.stockflow.dto.SupplierRequest;
import com.stockflow.entity.Supplier;
import com.stockflow.service.SupplierService;
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
@RequestMapping("/api/suppliers")
@Tag(name = "Supplier Management", description = "Endpoints for vendor relationship and supplier contact tracking")
@SecurityRequirement(name = "bearerAuth")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    @Operation(summary = "Get all suppliers")
    public ResponseEntity<List<Supplier>> getAllSuppliers(@RequestParam(required = false, defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(activeOnly ? supplierService.getActiveSuppliers() : supplierService.getAllSuppliers());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get supplier details by ID")
    public ResponseEntity<Supplier> getSupplierById(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.getSupplierById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Register a new supplier (Admin or Inventory Manager)")
    public ResponseEntity<Supplier> createSupplier(@Valid @RequestBody SupplierRequest request) {
        Supplier created = supplierService.createSupplier(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Update supplier details (Admin or Inventory Manager)")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id, @Valid @RequestBody SupplierRequest request) {
        return ResponseEntity.ok(supplierService.updateSupplier(id, request));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle supplier active status (Admin only)")
    public ResponseEntity<Void> toggleActive(@PathVariable Long id) {
        supplierService.toggleActiveStatus(id);
        return ResponseEntity.noContent().build();
    }
}

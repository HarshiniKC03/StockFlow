package com.stockflow.service;

import com.stockflow.dto.SupplierRequest;
import com.stockflow.entity.Supplier;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final AuditLogService auditLogService;

    public SupplierService(SupplierRepository supplierRepository, AuditLogService auditLogService) {
        this.supplierRepository = supplierRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Supplier> getActiveSuppliers() {
        return supplierRepository.findByActiveTrueOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with ID: " + id));
    }

    @Transactional
    public Supplier createSupplier(SupplierRequest request) {
        if (supplierRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Supplier already exists with name: " + request.getName());
        }

        Supplier supplier = new Supplier(
            request.getName().trim(),
            request.getContactPerson(),
            request.getEmail(),
            request.getPhone(),
            request.getAddress()
        );
        Supplier saved = supplierRepository.save(supplier);

        auditLogService.logAction("CREATE_SUPPLIER", "Supplier", saved.getId(),
            null, saved.getName(), "Created supplier: " + saved.getName());

        return saved;
    }

    @Transactional
    public Supplier updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = getSupplierById(id);

        if (!supplier.getName().equalsIgnoreCase(request.getName().trim()) &&
            supplierRepository.existsByNameIgnoreCase(request.getName().trim())) {
            throw new DuplicateResourceException("Supplier already exists with name: " + request.getName());
        }

        String oldVal = supplier.getName() + " - " + supplier.getEmail();
        supplier.setName(request.getName().trim());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());

        Supplier updated = supplierRepository.save(supplier);

        auditLogService.logAction("UPDATE_SUPPLIER", "Supplier", updated.getId(),
            oldVal, updated.getName() + " - " + updated.getEmail(), "Updated supplier information");

        return updated;
    }

    @Transactional
    public void toggleActiveStatus(Long id) {
        Supplier supplier = getSupplierById(id);
        boolean prev = supplier.isActive();
        supplier.setActive(!prev);
        supplierRepository.save(supplier);

        auditLogService.logAction("TOGGLE_SUPPLIER_STATUS", "Supplier", supplier.getId(),
            String.valueOf(prev), String.valueOf(!prev), "Changed active status");
    }
}

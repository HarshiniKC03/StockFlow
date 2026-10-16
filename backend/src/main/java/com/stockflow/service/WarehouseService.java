package com.stockflow.service;

import com.stockflow.dto.WarehouseRequest;
import com.stockflow.entity.Warehouse;
import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.repository.WarehouseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WarehouseService {

    private final WarehouseRepository warehouseRepository;
    private final AuditLogService auditLogService;

    public WarehouseService(WarehouseRepository warehouseRepository, AuditLogService auditLogService) {
        this.warehouseRepository = warehouseRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Warehouse> getActiveWarehouses() {
        return warehouseRepository.findByActiveTrueOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + id));
    }

    @Transactional
    public Warehouse createWarehouse(WarehouseRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (warehouseRepository.existsByCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("Warehouse already exists with code: " + code);
        }

        Warehouse warehouse = new Warehouse(
            request.getName().trim(),
            code,
            request.getLocation().trim(),
            request.getContactNumber()
        );
        Warehouse saved = warehouseRepository.save(warehouse);

        auditLogService.logAction("CREATE_WAREHOUSE", "Warehouse", saved.getId(),
            null, saved.getCode() + " - " + saved.getName(), "Created warehouse");

        return saved;
    }

    @Transactional
    public Warehouse updateWarehouse(Long id, WarehouseRequest request) {
        Warehouse warehouse = getWarehouseById(id);
        String code = request.getCode().trim().toUpperCase();

        if (!warehouse.getCode().equalsIgnoreCase(code) && warehouseRepository.existsByCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("Warehouse already exists with code: " + code);
        }

        String oldVal = warehouse.getCode() + " - " + warehouse.getName();
        warehouse.setName(request.getName().trim());
        warehouse.setCode(code);
        warehouse.setLocation(request.getLocation().trim());
        warehouse.setContactNumber(request.getContactNumber());

        Warehouse updated = warehouseRepository.save(warehouse);

        auditLogService.logAction("UPDATE_WAREHOUSE", "Warehouse", updated.getId(),
            oldVal, updated.getCode() + " - " + updated.getName(), "Updated warehouse information");

        return updated;
    }

    @Transactional
    public void toggleActiveStatus(Long id) {
        Warehouse warehouse = getWarehouseById(id);
        boolean prev = warehouse.isActive();
        warehouse.setActive(!prev);
        warehouseRepository.save(warehouse);

        auditLogService.logAction("TOGGLE_WAREHOUSE_STATUS", "Warehouse", warehouse.getId(),
            String.valueOf(prev), String.valueOf(!prev), "Changed active status");
    }
}

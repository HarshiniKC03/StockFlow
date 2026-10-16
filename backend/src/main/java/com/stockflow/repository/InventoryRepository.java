package com.stockflow.repository;

import com.stockflow.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProductIdAndWarehouseId(Long productId, Long warehouseId);

    /**
     * Pessimistic Write Lock (SELECT ... FOR UPDATE) to eliminate overselling
     * and race conditions when multiple orders/adjustments target the same product inventory.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.warehouse.id = :warehouseId")
    Optional<Inventory> findByProductIdAndWarehouseIdForUpdate(@Param("productId") Long productId,
                                                              @Param("warehouseId") Long warehouseId);

    List<Inventory> findByWarehouseId(Long warehouseId);

    List<Inventory> findByProductId(Long productId);

    @Query("SELECT i FROM Inventory i WHERE i.product.active = true AND i.quantityAvailable <= i.product.minimumStock ORDER BY i.quantityAvailable ASC")
    List<Inventory> findLowStockInventories();

    @Query("SELECT COUNT(i) FROM Inventory i WHERE i.product.active = true AND i.quantityAvailable <= i.product.minimumStock")
    long countLowStockInventories();

    @Query("SELECT COALESCE(SUM(i.quantityAvailable), 0) FROM Inventory i")
    long sumTotalQuantity();

    @Query("SELECT COALESCE(SUM(i.quantityAvailable * i.product.unitPrice), 0) FROM Inventory i WHERE i.product.active = true")
    BigDecimal calculateTotalInventoryValuation();
}

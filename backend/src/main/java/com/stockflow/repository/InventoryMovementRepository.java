package com.stockflow.repository;

import com.stockflow.entity.InventoryMovement;
import com.stockflow.entity.enums.MovementType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {

    List<InventoryMovement> findByOrderByTimestampDesc();

    List<InventoryMovement> findByProductIdOrderByTimestampDesc(Long productId);

    List<InventoryMovement> findByWarehouseIdOrderByTimestampDesc(Long warehouseId);

    List<InventoryMovement> findByMovementTypeOrderByTimestampDesc(MovementType movementType);

    @Query("SELECT m FROM InventoryMovement m WHERE " +
           "(:productId IS NULL OR m.product.id = :productId) AND " +
           "(:warehouseId IS NULL OR m.warehouse.id = :warehouseId) AND " +
           "(:type IS NULL OR m.movementType = :type) " +
           "ORDER BY m.timestamp DESC")
    List<InventoryMovement> filterMovements(@Param("productId") Long productId,
                                           @Param("warehouseId") Long warehouseId,
                                           @Param("type") MovementType type);
}

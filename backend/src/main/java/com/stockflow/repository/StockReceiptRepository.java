package com.stockflow.repository;

import com.stockflow.entity.StockReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockReceiptRepository extends JpaRepository<StockReceipt, Long> {
    Optional<StockReceipt> findByReceiptNumber(String receiptNumber);
    List<StockReceipt> findByOrderByReceiptDateDesc();
    List<StockReceipt> findBySupplierIdOrderByReceiptDateDesc(Long supplierId);
    List<StockReceipt> findByWarehouseIdOrderByReceiptDateDesc(Long warehouseId);
}

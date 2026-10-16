package com.stockflow.service;

import com.stockflow.dto.DashboardMetricsResponse;
import com.stockflow.entity.Inventory;
import com.stockflow.entity.Order;
import com.stockflow.entity.enums.OrderStatus;
import com.stockflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderRepository orderRepository;

    public ReportService(ProductRepository productRepository,
                         SupplierRepository supplierRepository,
                         WarehouseRepository warehouseRepository,
                         InventoryRepository inventoryRepository,
                         OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
        this.warehouseRepository = warehouseRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getDashboardMetrics() {
        DashboardMetricsResponse metrics = new DashboardMetricsResponse();

        metrics.setTotalActiveProducts(productRepository.countByActiveTrue());
        metrics.setTotalSuppliers(supplierRepository.count());
        metrics.setTotalWarehouses(warehouseRepository.count());
        metrics.setTotalStockUnits(inventoryRepository.sumTotalQuantity());
        metrics.setTotalInventoryValuation(inventoryRepository.calculateTotalInventoryValuation());
        metrics.setLowStockCount(inventoryRepository.countLowStockInventories());

        metrics.setTotalOrders(orderRepository.count());
        metrics.setPendingOrders(orderRepository.countByStatus(OrderStatus.CREATED) + orderRepository.countByStatus(OrderStatus.PROCESSING));
        metrics.setConfirmedOrders(orderRepository.countByStatus(OrderStatus.CONFIRMED));
        metrics.setDeliveredOrders(orderRepository.countByStatus(OrderStatus.DELIVERED));
        metrics.setTotalRevenue(orderRepository.calculateTotalRevenue());

        Map<String, Long> statusMap = new HashMap<>();
        for (OrderStatus st : OrderStatus.values()) {
            statusMap.put(st.name(), orderRepository.countByStatus(st));
        }
        metrics.setOrdersByStatus(statusMap);

        return metrics;
    }

    @Transactional(readOnly = true)
    public ByteArrayInputStream exportInventoryToCsv() {
        List<Inventory> inventories = inventoryRepository.findAll();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            // Write CSV Header
            writer.println("Inventory ID,SKU,Product Name,Category,Warehouse Code,Warehouse Name,Quantity Available,Minimum Stock Level,Unit Price (INR),Valuation (INR),Low Stock Warning");

            for (Inventory inv : inventories) {
                BigDecimal unitPrice = inv.getProduct().getUnitPrice() != null ? inv.getProduct().getUnitPrice() : BigDecimal.ZERO;
                BigDecimal lineValuation = unitPrice.multiply(BigDecimal.valueOf(inv.getQuantityAvailable()));
                String category = inv.getProduct().getCategory() != null ? inv.getProduct().getCategory().getName() : "N/A";

                writer.printf("%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%d,%d,%.2f,%.2f,%s%n",
                    inv.getId(),
                    escapeCsv(inv.getProduct().getSku()),
                    escapeCsv(inv.getProduct().getName()),
                    escapeCsv(category),
                    escapeCsv(inv.getWarehouse().getCode()),
                    escapeCsv(inv.getWarehouse().getName()),
                    inv.getQuantityAvailable(),
                    inv.getProduct().getMinimumStock(),
                    unitPrice,
                    lineValuation,
                    inv.isLowStock() ? "YES" : "NO"
                );
            }
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    @Transactional(readOnly = true)
    public ByteArrayInputStream exportOrdersToCsv() {
        List<Order> orders = orderRepository.findByOrderByCreatedAtDesc();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (PrintWriter writer = new PrintWriter(out, true, StandardCharsets.UTF_8)) {
            // Write CSV Header
            writer.println("Order Number,Customer Name,Customer Email,Warehouse,Status,Total Amount (INR),Created At,Items Count");

            for (Order o : orders) {
                String customerName = o.getCustomer() != null ? o.getCustomer().getName() : "N/A";
                String customerEmail = o.getCustomer() != null ? o.getCustomer().getEmail() : "N/A";
                String warehouseName = o.getWarehouse() != null ? o.getWarehouse().getName() : "N/A";
                String createdAt = o.getCreatedAt() != null ? o.getCreatedAt().format(dtf) : "";

                writer.printf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",%.2f,\"%s\",%d%n",
                    escapeCsv(o.getOrderNumber()),
                    escapeCsv(customerName),
                    escapeCsv(customerEmail),
                    escapeCsv(warehouseName),
                    o.getStatus().name(),
                    o.getTotalAmount(),
                    createdAt,
                    o.getItems().size()
                );
            }
        }

        return new ByteArrayInputStream(out.toByteArray());
    }

    private String escapeCsv(String str) {
        if (str == null) return "";
        return str.replace("\"", "\"\"");
    }
}

package com.stockflow.dto;

import java.math.BigDecimal;
import java.util.Map;

public class DashboardMetricsResponse {
    private long totalActiveProducts;
    private long totalSuppliers;
    private long totalWarehouses;
    private long totalStockUnits;
    private BigDecimal totalInventoryValuation;
    private long lowStockCount;
    private long totalOrders;
    private long pendingOrders;
    private long confirmedOrders;
    private long deliveredOrders;
    private BigDecimal totalRevenue;
    private Map<String, Long> ordersByStatus;

    public DashboardMetricsResponse() {}

    public long getTotalActiveProducts() {
        return totalActiveProducts;
    }

    public void setTotalActiveProducts(long totalActiveProducts) {
        this.totalActiveProducts = totalActiveProducts;
    }

    public long getTotalSuppliers() {
        return totalSuppliers;
    }

    public void setTotalSuppliers(long totalSuppliers) {
        this.totalSuppliers = totalSuppliers;
    }

    public long getTotalWarehouses() {
        return totalWarehouses;
    }

    public void setTotalWarehouses(long totalWarehouses) {
        this.totalWarehouses = totalWarehouses;
    }

    public long getTotalStockUnits() {
        return totalStockUnits;
    }

    public void setTotalStockUnits(long totalStockUnits) {
        this.totalStockUnits = totalStockUnits;
    }

    public BigDecimal getTotalInventoryValuation() {
        return totalInventoryValuation;
    }

    public void setTotalInventoryValuation(BigDecimal totalInventoryValuation) {
        this.totalInventoryValuation = totalInventoryValuation;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public long getPendingOrders() {
        return pendingOrders;
    }

    public void setPendingOrders(long pendingOrders) {
        this.pendingOrders = pendingOrders;
    }

    public long getConfirmedOrders() {
        return confirmedOrders;
    }

    public void setConfirmedOrders(long confirmedOrders) {
        this.confirmedOrders = confirmedOrders;
    }

    public long getDeliveredOrders() {
        return deliveredOrders;
    }

    public void setDeliveredOrders(long deliveredOrders) {
        this.deliveredOrders = deliveredOrders;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Map<String, Long> getOrdersByStatus() {
        return ordersByStatus;
    }

    public void setOrdersByStatus(Map<String, Long> ordersByStatus) {
        this.ordersByStatus = ordersByStatus;
    }
}

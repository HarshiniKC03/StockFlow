package com.stockflow.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class StockReceiptRequest {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    @NotNull(message = "Warehouse ID is required")
    private Long warehouseId;

    private String notes;

    @NotEmpty(message = "At least one item must be included in the receipt")
    @Valid
    private List<StockReceiptItemRequest> items;

    public StockReceiptRequest() {}

    public StockReceiptRequest(Long supplierId, Long warehouseId, String notes, List<StockReceiptItemRequest> items) {
        this.supplierId = supplierId;
        this.warehouseId = warehouseId;
        this.notes = notes;
        this.items = items;
    }

    public Long getSupplierId() {
        return supplierId;
    }

    public void setSupplierId(Long supplierId) {
        this.supplierId = supplierId;
    }

    public Long getWarehouseId() {
        return warehouseId;
    }

    public void setWarehouseId(Long warehouseId) {
        this.warehouseId = warehouseId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<StockReceiptItemRequest> getItems() {
        return items;
    }

    public void setItems(List<StockReceiptItemRequest> items) {
        this.items = items;
    }
}

package com.stockflow.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stock_receipts")
public class StockReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_number", nullable = false, unique = true, length = 50)
    private String receiptNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "receipt_date", nullable = false)
    private LocalDateTime receiptDate;

    @Column(length = 255)
    private String notes;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "received_by_id")
    private User receivedBy;

    @OneToMany(mappedBy = "stockReceipt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<StockReceiptItem> items = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        if (this.receiptDate == null) {
            this.receiptDate = LocalDateTime.now();
        }
    }

    public StockReceipt() {}

    public StockReceipt(String receiptNumber, Supplier supplier, Warehouse warehouse, String notes, User receivedBy) {
        this.receiptNumber = receiptNumber;
        this.supplier = supplier;
        this.warehouse = warehouse;
        this.notes = notes;
        this.receivedBy = receivedBy;
        this.receiptDate = LocalDateTime.now();
    }

    public void addItem(StockReceiptItem item) {
        items.add(item);
        item.setStockReceipt(this);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReceiptNumber() {
        return receiptNumber;
    }

    public void setReceiptNumber(String receiptNumber) {
        this.receiptNumber = receiptNumber;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    public Warehouse getWarehouse() {
        return warehouse;
    }

    public void setWarehouse(Warehouse warehouse) {
        this.warehouse = warehouse;
    }

    public LocalDateTime getReceiptDate() {
        return receiptDate;
    }

    public void setReceiptDate(LocalDateTime receiptDate) {
        this.receiptDate = receiptDate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public User getReceivedBy() {
        return receivedBy;
    }

    public void setReceivedBy(User receivedBy) {
        this.receivedBy = receivedBy;
    }

    public List<StockReceiptItem> getItems() {
        return items;
    }

    public void setItems(List<StockReceiptItem> items) {
        this.items = items;
    }
}

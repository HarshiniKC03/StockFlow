package com.stockflow.concurrency;

import com.stockflow.entity.Category;
import com.stockflow.entity.Inventory;
import com.stockflow.entity.Product;
import com.stockflow.entity.Warehouse;
import com.stockflow.exception.InsufficientStockException;
import com.stockflow.repository.CategoryRepository;
import com.stockflow.repository.InventoryRepository;
import com.stockflow.repository.ProductRepository;
import com.stockflow.repository.WarehouseRepository;
import com.stockflow.service.InventoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class InventoryConcurrencyTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private WarehouseRepository warehouseRepository;

    @Test
    @DisplayName("Simulate 2 concurrent threads ordering 4 units each from 5 units stock: exactly 1 succeeds, 1 fails, zero overselling")
    void testConcurrentOrdersPreventOverselling() throws InterruptedException {
        // Setup isolated product & inventory with 5 units available
        Category cat = categoryRepository.save(new Category("Concurrency Test Cat", "Test"));
        String suffix = String.valueOf(System.currentTimeMillis() % 10000000);
        Warehouse wh = warehouseRepository.save(new Warehouse("Concurrency Test Hub", "WH-C-" + suffix, "Test Loc", "123"));
        Product laptop = productRepository.save(new Product(
            "Limited Stock Laptop", "LP-C-" + suffix, "Limited 5 units",
            new BigDecimal("60000.00"), 2, cat, null
        ));

        Inventory inventory = inventoryRepository.save(new Inventory(laptop, wh, 5));

        int numberOfThreads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            final String orderId = "ORD-RACE-" + i;
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // ensure both threads fire simultaneously
                    inventoryService.deductStockForOrder(laptop.getId(), wh.getId(), 4, orderId);
                    successCount.incrementAndGet();
                } catch (InsufficientStockException ex) {
                    failureCount.incrementAndGet();
                } catch (Exception ex) {
                    ex.printStackTrace();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        readyLatch.await();
        startLatch.countDown(); // FIRE!
        boolean finishedInTime = doneLatch.await(10, TimeUnit.SECONDS);
        executor.shutdown();

        assertTrue(finishedInTime, "Concurrent execution timed out");

        // Verify concurrency isolation
        assertEquals(1, successCount.get(), "Exactly one order of 4 units must succeed");
        assertEquals(1, failureCount.get(), "The second order of 4 units must fail due to InsufficientStockException");

        // Verify remaining inventory: 5 - 4 = 1
        Inventory finalInventory = inventoryRepository.findByProductIdAndWarehouseId(laptop.getId(), wh.getId()).orElseThrow();
        assertEquals(1, finalInventory.getQuantityAvailable(), "Final stock must be exactly 1 unit; zero overselling occurred!");
    }
}

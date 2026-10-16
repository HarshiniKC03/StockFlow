package com.stockflow.service;

import com.stockflow.dto.OrderCreateRequest;
import com.stockflow.dto.OrderItemRequest;
import com.stockflow.dto.OrderResponse;
import com.stockflow.entity.*;
import com.stockflow.entity.enums.OrderStatus;
import com.stockflow.exception.InvalidOrderStateException;
import com.stockflow.repository.CustomerRepository;
import com.stockflow.repository.OrderRepository;
import com.stockflow.repository.ProductRepository;
import com.stockflow.repository.UserRepository;
import com.stockflow.repository.WarehouseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private WarehouseRepository warehouseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private OrderService orderService;

    private Customer sampleCustomer;
    private Warehouse sampleWarehouse;
    private Product productKeyboard;
    private Product productMouse;

    @BeforeEach
    void setUp() {
        sampleCustomer = new Customer("John Doe", "john@example.com", "+91-9988776655", "Bangalore");
        sampleCustomer.setId(1L);

        sampleWarehouse = new Warehouse("Hub 1", "WH-1", "Bangalore", "+91-9988776655");
        sampleWarehouse.setId(2L);

        productKeyboard = new Product("Keyboard", "KB-1", "Desc", new BigDecimal("1000.00"), 5, null, null);
        productKeyboard.setId(10L);
        productKeyboard.setActive(true);

        productMouse = new Product("Mouse", "MOU-1", "Desc", new BigDecimal("500.00"), 5, null, null);
        productMouse.setId(20L);
        productMouse.setActive(true);
    }

    @Test
    @DisplayName("Should correctly calculate order totals on the server without trusting client prices")
    void shouldCalculateOrderTotalsCorrectly() {
        // Customer orders 2 Keyboards (@1000 = 2000) and 1 Mouse (@500 = 500) -> Total must be 2500
        OrderCreateRequest request = new OrderCreateRequest(
            "John Doe", "john@example.com", "+91-9988776655", "Bangalore", 2L,
            List.of(new OrderItemRequest(10L, 2), new OrderItemRequest(20L, 1))
        );
        request.setAutoConfirm(false); // test creation phase

        when(warehouseRepository.findById(2L)).thenReturn(Optional.of(sampleWarehouse));
        when(customerRepository.findByEmailIgnoreCase("john@example.com")).thenReturn(Optional.of(sampleCustomer));
        when(productRepository.findById(10L)).thenReturn(Optional.of(productKeyboard));
        when(productRepository.findById(20L)).thenReturn(Optional.of(productMouse));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(100L);
            return o;
        });

        OrderResponse response = orderService.createOrder(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("2500.00"), response.getTotalAmount());
        assertEquals(2, response.getItems().size());
        assertEquals(OrderStatus.CREATED.name(), response.getStatus());
    }

    @Test
    @DisplayName("Should prevent invalid order transitions (skipping lifecycle steps)")
    void shouldPreventInvalidStateTransition() {
        Order order = new Order("ORD-100", sampleCustomer, sampleWarehouse, null);
        order.setId(100L);
        order.setStatus(OrderStatus.CREATED);

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        // CREATED cannot jump directly to SHIPPED or DELIVERED without CONFIRMED
        assertThrows(InvalidOrderStateException.class, () -> {
            orderService.updateOrderStatus(100L, OrderStatus.DELIVERED);
        });
    }

    @Test
    @DisplayName("Should prevent cancellation of already delivered orders")
    void shouldPreventCancellationOfDeliveredOrder() {
        Order order = new Order("ORD-100", sampleCustomer, sampleWarehouse, null);
        order.setId(100L);
        order.setStatus(OrderStatus.DELIVERED);

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        InvalidOrderStateException ex = assertThrows(InvalidOrderStateException.class, () -> {
            orderService.cancelOrder(100L, "Customer no longer needs this");
        });

        assertTrue(ex.getMessage().contains("Delivered orders cannot be cancelled"));
        verify(inventoryService, never()).restoreStockForCancellation(any(), any(), anyInt(), any(), any());
    }

    @Test
    @DisplayName("Should prevent cancellation of orders in SHIPPED status")
    void shouldPreventCancellationOfShippedOrder() {
        Order order = new Order("ORD-100", sampleCustomer, sampleWarehouse, null);
        order.setId(100L);
        order.setStatus(OrderStatus.SHIPPED);

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));

        assertThrows(InvalidOrderStateException.class, () -> {
            orderService.cancelOrder(100L, "Customer refused");
        });
    }

    @Test
    @DisplayName("Should successfully cancel CONFIRMED order and restore inventory")
    void shouldCancelConfirmedOrderAndRestoreInventory() {
        Order order = new Order("ORD-100", sampleCustomer, sampleWarehouse, null);
        order.setId(100L);
        order.setStatus(OrderStatus.CONFIRMED);

        OrderItem item = new OrderItem(order, productKeyboard, 3, productKeyboard.getUnitPrice());
        order.addItem(item);

        when(orderRepository.findById(100L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse cancelledResponse = orderService.cancelOrder(100L, "Duplicate purchase by user");

        assertEquals(OrderStatus.CANCELLED.name(), cancelledResponse.getStatus());
        verify(inventoryService, times(1)).restoreStockForCancellation(
            eq(10L), eq(2L), eq(3), eq("ORD-100"), eq("Duplicate purchase by user")
        );
    }
}

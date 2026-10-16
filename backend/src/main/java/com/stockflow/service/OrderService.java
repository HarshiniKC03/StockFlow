package com.stockflow.service;

import com.stockflow.dto.*;
import com.stockflow.entity.*;
import com.stockflow.entity.enums.OrderStatus;
import com.stockflow.exception.BadRequestException;
import com.stockflow.exception.InvalidOrderStateException;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.repository.CustomerRepository;
import com.stockflow.repository.OrderRepository;
import com.stockflow.repository.ProductRepository;
import com.stockflow.repository.UserRepository;
import com.stockflow.repository.WarehouseRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final InventoryService inventoryService;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        CustomerRepository customerRepository,
                        WarehouseRepository warehouseRepository,
                        UserRepository userRepository,
                        InventoryService inventoryService,
                        AuditLogService auditLogService,
                        NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.customerRepository = customerRepository;
        this.warehouseRepository = warehouseRepository;
        this.userRepository = userRepository;
        this.inventoryService = inventoryService;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(OrderStatus status, Long warehouseId, LocalDateTime startDate, LocalDateTime endDate) {
        List<Order> orders = orderRepository.filterOrders(status, warehouseId, startDate, endDate);
        return orders.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));
        return mapToResponse(order);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with order number: " + orderNumber));
        return mapToResponse(order);
    }

    /**
     * Creates and optionally confirms an order within a single atomic database transaction.
     */
    @Transactional
    public OrderResponse createOrder(OrderCreateRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
            .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with ID: " + request.getWarehouseId()));

        // Resolve or create customer record
        Customer customer = customerRepository.findByEmailIgnoreCase(request.getCustomerEmail())
            .orElseGet(() -> {
                Customer newCust = new Customer(
                    request.getCustomerName().trim(),
                    request.getCustomerEmail(),
                    request.getCustomerPhone(),
                    request.getCustomerAddress()
                );
                return customerRepository.save(newCust);
            });

        User currentUser = getCurrentUser();
        String orderNumber = "ORD-" + System.currentTimeMillis() + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Order order = new Order(orderNumber, customer, warehouse, currentUser);
        order.setStatus(OrderStatus.CREATED);

        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (OrderItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() <= 0) {
                throw new BadRequestException("Item quantity must be strictly greater than 0");
            }

            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + itemReq.getProductId()));

            if (!product.isActive()) {
                throw new BadRequestException("Product '" + product.getName() + "' is inactive and cannot be ordered");
            }

            // Server-side price snapshotting (never trust client prices!)
            BigDecimal unitPrice = product.getUnitPrice();
            OrderItem item = new OrderItem(order, product, itemReq.getQuantity(), unitPrice);
            order.addItem(item);

            calculatedTotal = calculatedTotal.add(item.getSubtotal());
        }

        order.setTotalAmount(calculatedTotal);
        Order savedOrder = orderRepository.save(order);

        auditLogService.logAction("CREATE_ORDER", "Order", savedOrder.getId(),
            null, savedOrder.getOrderNumber(), "Order created for customer " + customer.getName() + ", total: ₹" + calculatedTotal);

        // Auto-confirm if requested (default enterprise workflow)
        if (request.isAutoConfirm()) {
            confirmOrder(savedOrder.getId());
            savedOrder = orderRepository.findById(savedOrder.getId()).orElse(savedOrder);
        }

        return mapToResponse(savedOrder);
    }

    /**
     * Confirms an order: validates inventory with pessimistic locking,
     * deducts stock, records movements, and updates status to CONFIRMED.
     */
    @Transactional
    public OrderResponse confirmOrder(Long id) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));

        if (order.getStatus() != OrderStatus.CREATED) {
            throw new InvalidOrderStateException("Only orders in 'CREATED' status can be confirmed. Current status: " + order.getStatus());
        }

        // Deduct inventory for each order item with concurrency-safe locking
        for (OrderItem item : order.getItems()) {
            inventoryService.deductStockForOrder(
                item.getProduct().getId(),
                order.getWarehouse().getId(),
                item.getQuantity(),
                order.getOrderNumber()
            );
        }

        order.setStatus(OrderStatus.CONFIRMED);
        Order updated = orderRepository.save(order);

        auditLogService.logAction("CONFIRM_ORDER", "Order", updated.getId(),
            OrderStatus.CREATED.name(), OrderStatus.CONFIRMED.name(), "Order confirmed and stock allocated");

        notificationService.notify(
            "Order Confirmed: " + updated.getOrderNumber(),
            "Order #" + updated.getOrderNumber() + " confirmed for " + updated.getCustomer().getName() + " (Total: ₹" + updated.getTotalAmount() + ")",
            "ORDER_CONFIRMATION"
        );

        return mapToResponse(updated);
    }

    /**
     * Transitions an order forward in its lifecycle: CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
     */
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus newStatus) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));

        OrderStatus current = order.getStatus();

        if (newStatus == OrderStatus.CANCELLED) {
            throw new BadRequestException("Use the /cancel endpoint with a reason to cancel an order");
        }

        // Validate allowed lifecycle progressions
        boolean isValid = switch (current) {
            case CREATED -> newStatus == OrderStatus.CONFIRMED;
            case CONFIRMED -> newStatus == OrderStatus.PROCESSING;
            case PROCESSING -> newStatus == OrderStatus.SHIPPED;
            case SHIPPED -> newStatus == OrderStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };

        if (!isValid) {
            throw new InvalidOrderStateException(
                "Invalid state transition from '" + current + "' to '" + newStatus + "'."
            );
        }

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);

        auditLogService.logAction("UPDATE_ORDER_STATUS", "Order", updated.getId(),
            current.name(), newStatus.name(), "Order status transitioned to " + newStatus);

        return mapToResponse(updated);
    }

    /**
     * Cancels an eligible order and automatically restores allocated inventory.
     */
    @Transactional
    public OrderResponse cancelOrder(Long id, String reason) {
        Order order = orderRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + id));

        OrderStatus current = order.getStatus();

        if (current == OrderStatus.DELIVERED) {
            throw new InvalidOrderStateException("Delivered orders cannot be cancelled.");
        }
        if (current == OrderStatus.SHIPPED) {
            throw new InvalidOrderStateException("Orders in 'SHIPPED' status cannot be cancelled directly. A return process must be initiated.");
        }
        if (current == OrderStatus.CANCELLED) {
            throw new InvalidOrderStateException("Order is already cancelled.");
        }

        // If stock was allocated (CONFIRMED or PROCESSING), restore it back to warehouse inventory
        if (current == OrderStatus.CONFIRMED || current == OrderStatus.PROCESSING) {
            for (OrderItem item : order.getItems()) {
                inventoryService.restoreStockForCancellation(
                    item.getProduct().getId(),
                    order.getWarehouse().getId(),
                    item.getQuantity(),
                    order.getOrderNumber(),
                    reason
                );
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancellationReason(reason);
        Order updated = orderRepository.save(order);

        auditLogService.logAction("CANCEL_ORDER", "Order", updated.getId(),
            current.name(), OrderStatus.CANCELLED.name(), "Order cancelled. Reason: " + reason);

        notificationService.notify(
            "Order Cancelled: " + updated.getOrderNumber(),
            "Order #" + updated.getOrderNumber() + " was cancelled. Reason: " + reason,
            "ORDER_CANCELLATION"
        );

        return mapToResponse(updated);
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            return userRepository.findByUsername(auth.getName()).orElse(null);
        }
        return null;
    }

    public OrderResponse mapToResponse(Order order) {
        OrderResponse res = new OrderResponse();
        res.setId(order.getId());
        res.setOrderNumber(order.getOrderNumber());
        res.setStatus(order.getStatus().name());
        res.setTotalAmount(order.getTotalAmount());
        res.setCancellationReason(order.getCancellationReason());
        res.setCreatedAt(order.getCreatedAt());
        res.setUpdatedAt(order.getUpdatedAt());

        if (order.getCustomer() != null) {
            res.setCustomerId(order.getCustomer().getId());
            res.setCustomerName(order.getCustomer().getName());
            res.setCustomerEmail(order.getCustomer().getEmail());
            res.setCustomerPhone(order.getCustomer().getPhone());
            res.setCustomerAddress(order.getCustomer().getAddress());
        }

        if (order.getWarehouse() != null) {
            res.setWarehouseId(order.getWarehouse().getId());
            res.setWarehouseName(order.getWarehouse().getName());
            res.setWarehouseCode(order.getWarehouse().getCode());
        }

        if (order.getCreatedBy() != null) {
            res.setCreatedByUsername(order.getCreatedBy().getUsername());
        }

        List<OrderItemResponse> itemResponses = order.getItems().stream().map(item ->
            new OrderItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getSku(),
                item.getProductName(),
                item.getUnitPrice(),
                item.getQuantity(),
                item.getSubtotal()
            )
        ).collect(Collectors.toList());

        res.setItems(itemResponses);
        return res;
    }
}

package com.stockflow.config;

import com.stockflow.entity.*;
import com.stockflow.entity.enums.MovementType;
import com.stockflow.entity.enums.OrderStatus;
import com.stockflow.entity.enums.RoleName;
import com.stockflow.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final InventoryMovementRepository movementRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(RoleRepository roleRepository,
                           UserRepository userRepository,
                           CategoryRepository categoryRepository,
                           SupplierRepository supplierRepository,
                           WarehouseRepository warehouseRepository,
                           ProductRepository productRepository,
                           InventoryRepository inventoryRepository,
                           InventoryMovementRepository movementRepository,
                           CustomerRepository customerRepository,
                           OrderRepository orderRepository,
                           PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.warehouseRepository = warehouseRepository;
        this.productRepository = productRepository;
        this.inventoryRepository = inventoryRepository;
        this.movementRepository = movementRepository;
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (roleRepository.count() > 0) {
            logger.info("StockFlow database already contains initialized data. Skipping seed.");
            return;
        }

        logger.info("Seeding initial enterprise reference data for StockFlow...");

        // 1. Roles
        Role adminRole = roleRepository.save(new Role(RoleName.ROLE_ADMIN));
        Role managerRole = roleRepository.save(new Role(RoleName.ROLE_INVENTORY_MANAGER));
        Role salesRole = roleRepository.save(new Role(RoleName.ROLE_SALES_EMPLOYEE));

        // 2. Users
        User adminUser = new User("admin", "admin@stockflow.internal", passwordEncoder.encode("admin123"), "System Administrator");
        adminUser.setRoles(Set.of(adminRole, managerRole));
        userRepository.save(adminUser);

        User managerUser = new User("manager", "manager@stockflow.internal", passwordEncoder.encode("manager123"), "Inventory Lead Manager");
        managerUser.setRoles(Set.of(managerRole));
        userRepository.save(managerUser);

        User salesUser = new User("sales", "sales@stockflow.internal", passwordEncoder.encode("sales123"), "Sales Account Executive");
        salesUser.setRoles(Set.of(salesRole));
        userRepository.save(salesUser);

        // 3. Categories
        Category electronics = categoryRepository.save(new Category("Electronics", "Commercial laptops, displays, and compute equipment"));
        Category accessories = categoryRepository.save(new Category("Computer Accessories", "Keyboards, mice, docks, and peripherals"));
        Category furniture = categoryRepository.save(new Category("Office Furniture", "Ergonomic seating and workspace tables"));

        // 4. Suppliers
        Supplier techCorp = supplierRepository.save(new Supplier(
            "TechCorp Global", "Rajesh Sharma", "orders@techcorp.com", "+91-9876543210", "Tech Park, Bengaluru, India"
        ));
        Supplier apexComp = supplierRepository.save(new Supplier(
            "Apex Components", "Anita Roy", "sales@apexcomp.in", "+91-9811223344", "Okhla Phase III, New Delhi, India"
        ));

        // 5. Warehouses
        Warehouse whCentral = warehouseRepository.save(new Warehouse(
            "Central Distribution Hub", "WH-CENTRAL", "Sector 62, Noida, India", "+91-9988776655"
        ));
        Warehouse whSouth = warehouseRepository.save(new Warehouse(
            "South Regional Facility", "WH-SOUTH", "Whitefield, Bengaluru, India", "+91-9988776656"
        ));

        // 6. Products
        Product laptop = productRepository.save(new Product(
            "Business Laptop 15-inch", "LAP-1001", "Core i7, 16GB RAM, 512GB SSD Enterprise Edition",
            new BigDecimal("55000.00"), 10, electronics, techCorp
        ));
        Product keyboard = productRepository.save(new Product(
            "Wireless Mechanical Keyboard", "KB-2001", "Backlit mechanical switches with Bluetooth & 2.4G",
            new BigDecimal("2500.00"), 20, accessories, apexComp
        ));
        Product mouse = productRepository.save(new Product(
            "Ergonomic Optical Mouse", "MOU-3001", "Wireless silent click ergonomic mouse",
            new BigDecimal("850.00"), 25, accessories, apexComp
        ));
        Product monitor = productRepository.save(new Product(
            "4K Ultra-HD Monitor 27-inch", "MON-4001", "IPS panel, 99% sRGB, USB-C 65W charging",
            new BigDecimal("28000.00"), 8, electronics, techCorp
        ));
        Product dock = productRepository.save(new Product(
            "USB-C Multiport Docking Station", "DCK-5001", "Dual 4K HDMI, 100W PD, Gigabit Ethernet",
            new BigDecimal("4200.00"), 15, accessories, techCorp
        ));
        Product chair = productRepository.save(new Product(
            "Ergonomic High-Back Chair", "CHR-6001", "Adjustable lumbar support and 3D armrests",
            new BigDecimal("12500.00"), 5, furniture, apexComp
        ));

        // 7. Seed Inventory & Movements
        seedInventory(laptop, whCentral, 25, adminUser);
        seedInventory(keyboard, whCentral, 80, adminUser);
        seedInventory(mouse, whCentral, 120, adminUser);
        seedInventory(monitor, whCentral, 18, adminUser);
        seedInventory(dock, whCentral, 6, adminUser); // low stock! (min 15)
        seedInventory(chair, whCentral, 12, adminUser);

        seedInventory(laptop, whSouth, 15, adminUser);
        seedInventory(keyboard, whSouth, 45, adminUser);
        seedInventory(mouse, whSouth, 60, adminUser);
        seedInventory(monitor, whSouth, 4, adminUser); // low stock! (min 8)
        seedInventory(dock, whSouth, 20, adminUser);
        seedInventory(chair, whSouth, 8, adminUser);

        // 8. Seed Sample Customer & Order
        Customer customer = customerRepository.save(new Customer(
            "Alpha Enterprise Solutions", "procurement@alphaent.com", "+91-9871112233", "DLF Cyber City, Gurugram, India"
        ));

        Order sampleOrder = new Order("ORD-SEED-1001", customer, whCentral, salesUser);
        sampleOrder.setStatus(OrderStatus.DELIVERED);

        OrderItem item1 = new OrderItem(sampleOrder, keyboard, 2, keyboard.getUnitPrice());
        OrderItem item2 = new OrderItem(sampleOrder, mouse, 2, mouse.getUnitPrice());
        sampleOrder.addItem(item1);
        sampleOrder.addItem(item2);
        sampleOrder.setTotalAmount(item1.getSubtotal().add(item2.getSubtotal()));
        orderRepository.save(sampleOrder);

        logger.info("StockFlow initial seed data loaded successfully! Default accounts: admin/admin123, manager/manager123, sales/sales123");
    }

    private void seedInventory(Product product, Warehouse warehouse, int qty, User adminUser) {
        Inventory inv = inventoryRepository.save(new Inventory(product, warehouse, qty));
        movementRepository.save(new InventoryMovement(
            product, warehouse, MovementType.INITIAL_STOCK, qty, qty,
            "INIT-" + warehouse.getCode(), "Initial opening stock balance", adminUser
        ));
    }
}

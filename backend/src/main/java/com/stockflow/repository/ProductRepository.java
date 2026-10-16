package com.stockflow.repository;

import com.stockflow.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCase(String sku);

    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);

    List<Product> findBySupplierIdAndActiveTrue(Long supplierId);

    List<Product> findByActiveTrueOrderByNameAsc();

    long countByActiveTrue();

    @Query("SELECT p FROM Product p WHERE " +
           "(:activeOnly = false OR p.active = true) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:query IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Product> searchProducts(@Param("query") String query,
                                @Param("categoryId") Long categoryId,
                                @Param("activeOnly") boolean activeOnly);
}

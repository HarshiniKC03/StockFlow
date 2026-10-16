package com.stockflow.repository;

import com.stockflow.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findTop100ByOrderByTimestampDesc();

    List<AuditLog> findByEntityNameOrderByTimestampDesc(String entityName);

    List<AuditLog> findByUsernameOrderByTimestampDesc(String username);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:entityName IS NULL OR LOWER(a.entityName) = LOWER(:entityName)) AND " +
           "(:username IS NULL OR LOWER(a.username) = LOWER(:username)) AND " +
           "(:action IS NULL OR LOWER(a.action) = LOWER(:action)) " +
           "ORDER BY a.timestamp DESC")
    List<AuditLog> filterAuditLogs(@Param("entityName") String entityName,
                                  @Param("username") String username,
                                  @Param("action") String action);
}

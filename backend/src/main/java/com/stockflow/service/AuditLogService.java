package com.stockflow.service;

import com.stockflow.entity.AuditLog;
import com.stockflow.repository.AuditLogRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public void logAction(String action, String entityName, Long entityId,
                          String previousValue, String newValue, String details) {
        String username = "SYSTEM";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
            username = auth.getName();
        }

        AuditLog log = new AuditLog(username, action, entityName, entityId, previousValue, newValue, details, "127.0.0.1");
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs(String entityName, String username, String action) {
        if (entityName != null || username != null || action != null) {
            return auditLogRepository.filterAuditLogs(
                entityName != null && !entityName.isBlank() ? entityName : null,
                username != null && !username.isBlank() ? username : null,
                action != null && !action.isBlank() ? action : null
            );
        }
        return auditLogRepository.findTop100ByOrderByTimestampDesc();
    }
}

package com.stockflow.controller;

import com.stockflow.entity.AuditLog;
import com.stockflow.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@Tag(name = "Audit Logging", description = "Track operations, changes, and before-and-after values")
@SecurityRequirement(name = "bearerAuth")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Query audit trails (Admin only)")
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action) {
        return ResponseEntity.ok(auditLogService.getAuditLogs(entityName, username, action));
    }
}

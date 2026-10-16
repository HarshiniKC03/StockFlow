package com.stockflow.controller;

import com.stockflow.dto.DashboardMetricsResponse;
import com.stockflow.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports and Analytics", description = "Operational metrics, KPIs, and CSV exports")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get high-level dashboard metrics and business analytics")
    public ResponseEntity<DashboardMetricsResponse> getDashboardMetrics() {
        return ResponseEntity.ok(reportService.getDashboardMetrics());
    }

    @GetMapping("/inventory/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Export complete inventory report to CSV")
    public ResponseEntity<InputStreamResource> exportInventoryCsv() {
        ByteArrayInputStream stream = reportService.exportInventoryToCsv();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=stockflow_inventory_report.csv");

        return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(new InputStreamResource(stream));
    }

    @GetMapping("/orders/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'INVENTORY_MANAGER')")
    @Operation(summary = "Export customer orders report to CSV")
    public ResponseEntity<InputStreamResource> exportOrdersCsv() {
        ByteArrayInputStream stream = reportService.exportOrdersToCsv();
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=stockflow_orders_report.csv");

        return ResponseEntity.ok()
            .headers(headers)
            .contentType(MediaType.parseMediaType("text/csv"))
            .body(new InputStreamResource(stream));
    }
}

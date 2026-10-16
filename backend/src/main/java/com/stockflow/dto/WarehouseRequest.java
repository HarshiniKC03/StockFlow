package com.stockflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class WarehouseRequest {

    @NotBlank(message = "Warehouse name is required")
    @Size(max = 100, message = "Warehouse name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Warehouse code is required")
    @Size(max = 20, message = "Warehouse code cannot exceed 20 characters")
    private String code;

    @NotBlank(message = "Location is required")
    private String location;

    private String contactNumber;

    public WarehouseRequest() {}

    public WarehouseRequest(String name, String code, String location, String contactNumber) {
        this.name = name;
        this.code = code;
        this.location = location;
        this.contactNumber = contactNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }
}

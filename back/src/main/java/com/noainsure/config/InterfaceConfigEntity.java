package com.noainsure.config;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Column;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "interface_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterfaceConfigEntity {
    @Id
    private String id;
    private String internalSystem;
    private String partnerName;
    private String protocol;
    private String apiUrl;
    
    @Column(name = "timeout_ms")
    private int timeout;
    
    private int maxRetry;
    private String status; // ACTIVE, INACTIVE
}

package com.noainsure.audit;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// 운영 작업 이력(Audit Log) 엔티티
@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String actionType; // RETRY, DISCARD, POLICY_CREATE 등
    private String targetId;   // 대상 Trace ID 또는 정책 ID
    private String description;
    private String timestamp;
}

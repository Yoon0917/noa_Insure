package com.noainsure.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

// 운영 작업 이력 DB 접근 레포지토리
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {
    List<AuditLogEntity> findAllByOrderByIdDesc();
}
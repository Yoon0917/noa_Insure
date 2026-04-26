package com.noainsure.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

// 운영 작업 이력 비즈니스 로직 서비스
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void logAction(String actionType, String targetId, String description) {
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        AuditLogEntity log = new AuditLogEntity(null, actionType, targetId, description, now);
        auditLogRepository.save(log);
    }

    public List<AuditLogEntity> getRecentLogs() {
        // 최근 이력부터 정렬하여 반환
        return auditLogRepository.findAllByOrderByIdDesc();
    }
}

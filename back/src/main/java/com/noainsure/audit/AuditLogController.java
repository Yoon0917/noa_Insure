package com.noainsure.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

// 운영 작업 이력 API 컨트롤러
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public List<AuditLogEntity> getAuditLogs() {
        return auditLogService.getRecentLogs();
    }
}

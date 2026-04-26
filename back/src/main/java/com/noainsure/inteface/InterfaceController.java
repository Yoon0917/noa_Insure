// back/InterfaceController.java
package com.noainsure.inteface;

import com.noainsure.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interfaces")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // 프론트엔드(로컬 파일 혹은 타 포트)와 통신하기 위한 CORS 허용
public class InterfaceController {

    private final InterfaceService interfaceService;
    private final AuditLogService auditLogService;
    // 백엔드 API 라우팅

    @GetMapping
    public List<InterfaceEntity> fetchInterfaces() {
        return interfaceService.getAllInterfaces();
    }

    @PostMapping("/{id}/retry")
    public Map<String, Boolean> retryInterface(@PathVariable String id) {
        interfaceService.retryInterface(id);
        auditLogService.logAction("RETRY", id, "수동 통신 재처리 실행");
        return Map.of("success", true);
    }

    @PostMapping("/{id}/discard")
    public Map<String, Boolean> discardInterface(@PathVariable String id) {
        interfaceService.discardInterface(id);
        auditLogService.logAction("DISCARD", id, "영구 실패 건 처리 포기");
        return Map.of("success", true);
    }

    @PostMapping("/simulate")
    public InterfaceEntity simulate(@RequestBody InterfaceEntity requestData) {
        return interfaceService.simulateError(requestData);
    }
}
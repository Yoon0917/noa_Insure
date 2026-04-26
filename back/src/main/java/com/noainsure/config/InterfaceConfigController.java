package com.noainsure.config;

import com.noainsure.audit.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interface-configs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InterfaceConfigController {

    private final InterfaceConfigService configService;
    @Autowired
    private final AuditLogService auditLogService;

    @GetMapping
    public List<InterfaceConfigEntity> getConfigs() {
        return configService.getAllConfigs();
    }

    @PostMapping
    public InterfaceConfigEntity addConfig(@RequestBody InterfaceConfigEntity req) {
        InterfaceConfigEntity saved = configService.addConfig(req);
        auditLogService.logAction("CREATE_POLICY", saved.getId(), "신규 인터페이스 정책 등록");
        return saved;
    }

    @PutMapping("/{id}")
    public ResponseEntity<InterfaceConfigEntity> updateConfig(@PathVariable String id, @RequestBody InterfaceConfigEntity req) {
        return configService.updateConfig(id, req)
                .map(updated -> {
                    auditLogService.logAction("UPDATE_POLICY", id, "인터페이스 정책 변경");
                    return ResponseEntity.ok(updated);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConfig(@PathVariable String id) {
        if (configService.deleteConfig(id)) {
            auditLogService.logAction("DELETE_POLICY", id, "인터페이스 정책 삭제");
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}

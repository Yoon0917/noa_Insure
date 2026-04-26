package com.noainsure.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InterfaceConfigService {

    private final InterfaceConfigRepository configRepository;

    @PostConstruct
    public void init() {
        // 테스트용 기본 데이터 세팅
        if (configRepository.count() == 0) {
            configRepository.save(new InterfaceConfigEntity("IF-KB-001", "고객 실적 원장", "KB국민은행", "REST API", "https://api.kbstar.com/v1/records", 5000, 3, "ACTIVE"));
            configRepository.save(new InterfaceConfigEntity("IF-KB-002", "외환/환율 정보", "KB국민은행", "REST API", "https://api.kbstar.com/v1/exchange", 3000, 2, "ACTIVE"));
            configRepository.save(new InterfaceConfigEntity("IF-UP-001", "가상자산 시세 원장", "업비트", "REST API", "https://api.upbit.com/v1/ticker", 3000, 5, "ACTIVE"));
            configRepository.save(new InterfaceConfigEntity("IF-NICE-001", "신용평가 원장", "나이스평가정보", "SOAP", "https://api.nice.co.kr/soap/credit", 8000, 2, "ACTIVE"));
            configRepository.save(new InterfaceConfigEntity("IF-TOSS-001", "간편결제 원장", "토스페이먼츠", "REST API", "https://api.tosspayments.com/v1/payments", 4000, 3, "ACTIVE"));
            configRepository.save(new InterfaceConfigEntity("IF-SCI-001", "보증보험 연동", "서울보증보험", "MQ", "tcp://mq.sgic.co.kr:61616", 10000, 1, "ACTIVE"));
        }
    }

    public List<InterfaceConfigEntity> getAllConfigs() {
        return configRepository.findAll();
    }

    @Transactional
    public InterfaceConfigEntity addConfig(InterfaceConfigEntity config) {
        if (config.getId() == null || config.getId().isEmpty()) {
            config.setId("IF-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        if (config.getStatus() == null || config.getStatus().isEmpty()) {
            config.setStatus("ACTIVE");
        }
        return configRepository.save(config);
    }

    @Transactional
    public boolean deleteConfig(String id) {
        if (configRepository.existsById(id)) {
            configRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public Optional<InterfaceConfigEntity> updateConfig(String id, InterfaceConfigEntity updatedConfig) {
        return configRepository.findById(id).map(existing -> {
            existing.setInternalSystem(updatedConfig.getInternalSystem());
            existing.setPartnerName(updatedConfig.getPartnerName());
            existing.setProtocol(updatedConfig.getProtocol());
            existing.setApiUrl(updatedConfig.getApiUrl());
            existing.setTimeout(updatedConfig.getTimeout());
            existing.setMaxRetry(updatedConfig.getMaxRetry());
            existing.setStatus(updatedConfig.getStatus());
            return configRepository.save(existing);
        });
    }
}
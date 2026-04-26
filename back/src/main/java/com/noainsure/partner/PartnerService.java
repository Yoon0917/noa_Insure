package com.noainsure.partner;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PartnerService {

    private final PartnerRepository partnerRepository;

    @PostConstruct
    public void init() {
        // 테스트용 기본 제휴사 데이터 세팅
        if (partnerRepository.count() == 0) {
            partnerRepository.save(new PartnerEntity("PT-KB-001", "KB국민은행", "김국민", "010-1111-2222", "주거래 은행 및 실적 연동"));
            partnerRepository.save(new PartnerEntity("PT-UP-002", "업비트", "이비트", "010-3333-4444", "가상자산 시세 정보 연동"));
            partnerRepository.save(new PartnerEntity("PT-NICE-003", "나이스평가정보", "박나이스", "010-5555-6666", "신용평가 정보 연동"));
            partnerRepository.save(new PartnerEntity("PT-TOSS-004", "토스페이먼츠", "최토스", "010-7777-8888", "간편결제 및 펌뱅킹 연동"));
            partnerRepository.save(new PartnerEntity("PT-SCI-005", "서울보증보험", "정보증", "010-9999-0000", "보증보험 가입/해지 연동"));
        }
    }

    @Transactional(readOnly = true)
    public List<PartnerEntity> getAllPartners() {
        return partnerRepository.findAll();
    }

    @Transactional
    public PartnerEntity addPartner(PartnerEntity partner) {
        if (partner.getId() == null || partner.getId().isEmpty()) {
            partner.setId(UUID.randomUUID().toString());
        }
        return partnerRepository.save(partner);
    }

    @Transactional
    public Optional<PartnerEntity> updatePartner(String id, PartnerEntity updatedPartner) {
        return partnerRepository.findById(id).map(existing -> {
            updatedPartner.setId(id);
            return partnerRepository.save(updatedPartner);
        });
    }

    @Transactional
    public boolean deletePartner(String id) {
        if (partnerRepository.existsById(id)) {
            partnerRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
package com.noainsure.inteface;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InterfaceService {

    private final InterfaceRepository interfaceRepository;

    public List<InterfaceEntity> getAllInterfaces() {
        return interfaceRepository.findAll();
    }

    @Transactional
    public void retryInterface(String id) {
        interfaceRepository.findById(id).ifPresent(entity -> {
            entity.setStatus("SUCCESS");
            entity.setStatusCode(200);
            interfaceRepository.save(entity);
        });
    }

    @Transactional
    public void discardInterface(String id) {
        interfaceRepository.findById(id).ifPresent(entity -> {
            entity.setStatus("DISCARDED");
            interfaceRepository.save(entity);
        });
    }

    @Transactional
    public InterfaceEntity simulateError(InterfaceEntity requestData) {
        if (requestData.getId() == null || requestData.getId().isEmpty()) {
            requestData.setId(UUID.randomUUID().toString());
        }
        return interfaceRepository.save(requestData);
    }
}
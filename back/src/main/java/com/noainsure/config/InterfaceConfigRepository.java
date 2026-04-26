package com.noainsure.config;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// 인터페이스 연동 정책 설정 레포지토리
@Repository
public interface InterfaceConfigRepository extends JpaRepository<InterfaceConfigEntity, String> {
}

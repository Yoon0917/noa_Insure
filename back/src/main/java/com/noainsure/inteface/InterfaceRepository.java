package com.noainsure.inteface;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

// 메인 트랜잭션(인터페이스) 관제 레포지토리
@Repository
public interface InterfaceRepository extends JpaRepository<InterfaceEntity, String> {
}
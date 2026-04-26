package com.noainsure.config;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InterfaceConfigRepository extends JpaRepository<InterfaceConfigEntity, String> {
}

package com.noainsure.inteface;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InterfaceRepository extends JpaRepository<InterfaceEntity, String> {
}
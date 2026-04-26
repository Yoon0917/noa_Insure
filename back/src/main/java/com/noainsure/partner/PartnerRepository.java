// back/PartnerRepository.java
package com.noainsure.partner;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnerRepository extends JpaRepository<PartnerEntity, String> {
}
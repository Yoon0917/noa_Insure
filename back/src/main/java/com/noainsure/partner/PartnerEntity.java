package com.noainsure.partner;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "partners")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PartnerEntity {
    @Id
    private String id;
    private String name;
    private String contactPerson;
    private String contactPhone;
    private String description;
}
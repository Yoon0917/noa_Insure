package com.noainsure.inteface;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "interfaces")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterfaceEntity {
    @Id
    private String id;
    private String traceId;
    private String institution;
    private String protocol;
    private String status;
    private String time;
    private String payload;
    private int statusCode;
}
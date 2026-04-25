package com.societycms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "common_areas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CommonArea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "society_id", nullable = false)
    private Society society;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    private Building building;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "floor_number")
    private Integer floorNumber;
}

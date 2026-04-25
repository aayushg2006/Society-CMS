package com.societycms.entity;

import com.societycms.enums.FlatType;
import com.societycms.enums.OccupancyStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "flats")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Flat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false)
    private Building building;

    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber;

    @Column(name = "flat_number", nullable = false, length = 20)
    private String flatNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 30)
    private FlatType type = FlatType._2BHK;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "occupancy_status", length = 30)
    private OccupancyStatus occupancyStatus = OccupancyStatus.VACANT;

    @Column(name = "intercom_extension", length = 10)
    private String intercomExtension;
}

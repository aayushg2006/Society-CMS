package com.societycms.entity;

import com.societycms.enums.SubscriptionPlan;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "societies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Society {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(name = "zip_code", length = 20)
    private String zipCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_plan", length = 30)
    private SubscriptionPlan subscriptionPlan = SubscriptionPlan.FREE;

    private Double latitude;
    private Double longitude;

    @Column(name = "geo_fence_radius")
    private Integer geoFenceRadius = 500;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "society", cascade = CascadeType.ALL)
    private List<Building> buildings;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToMany(mappedBy = "society", cascade = CascadeType.ALL)
    private List<User> users;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

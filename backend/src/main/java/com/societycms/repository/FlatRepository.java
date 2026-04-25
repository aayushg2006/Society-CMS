package com.societycms.repository;

import com.societycms.entity.Flat;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FlatRepository extends JpaRepository<Flat, Long> {
    List<Flat> findByBuildingId(Long buildingId);
    List<Flat> findByBuildingSocietyId(Long societyId);
    java.util.Optional<Flat> findByBuildingIdAndFlatNumber(Long buildingId, String flatNumber);
}

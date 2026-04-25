package com.societycms.repository;

import com.societycms.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BuildingRepository extends JpaRepository<Building, Long> {
    List<Building> findBySocietyId(Long societyId);
    java.util.Optional<Building> findBySocietyIdAndName(Long societyId, String name);
}

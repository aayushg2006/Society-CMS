package com.societycms.repository;

import com.societycms.entity.CommonArea;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommonAreaRepository extends JpaRepository<CommonArea, Long> {
    List<CommonArea> findBySocietyId(Long societyId);
}

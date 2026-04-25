package com.societycms.repository;

import com.societycms.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SocietyRepository extends JpaRepository<Society, Long> {
    Optional<Society> findByCode(String code);
    boolean existsByCode(String code);
}

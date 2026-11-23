package com.gym.repository;

import com.gym.model.Settings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface SettingsRepository extends JpaRepository<Settings, Long> {
    List<Settings> findByGymId(Long gymId);
    
    List<Settings> findByUserId(Long userId);
    
    Optional<Settings> findByGymIdAndSettingKey(Long gymId, String settingKey);
    
    Optional<Settings> findByUserIdAndSettingKey(Long userId, String settingKey);
    
    @Query("SELECT s FROM Settings s WHERE s.gymId = :gymId AND s.category = :category")
    List<Settings> findByGymIdAndCategory(@Param("gymId") Long gymId, @Param("category") String category);
    
    @Query("SELECT s FROM Settings s WHERE s.userId = :userId AND s.category = :category")
    List<Settings> findByUserIdAndCategory(@Param("userId") Long userId, @Param("category") String category);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Settings s WHERE s.gymId = :gymId")
    void deleteByGymId(@Param("gymId") Long gymId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Settings s WHERE s.userId = :userId")
    void deleteByUserId(@Param("userId") Long userId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Settings s WHERE s.gymId = :gymId AND s.category = :category")
    void deleteByGymIdAndCategory(@Param("gymId") Long gymId, @Param("category") String category);
}
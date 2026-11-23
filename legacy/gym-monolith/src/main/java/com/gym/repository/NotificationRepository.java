package com.gym.repository;

import com.gym.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByGymIdOrderByCreatedAtDesc(Long gymId);
    
    List<Notification> findByGymIdAndUserIdOrderByCreatedAtDesc(Long gymId, Long userId);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.gymId = :gymId AND n.read = false")
    Long countUnreadByGymId(@Param("gymId") Long gymId);
    
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.gymId = :gymId AND n.id = :id")
    void markAsRead(@Param("gymId") Long gymId, @Param("id") Long id);
    
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.read = true WHERE n.gymId = :gymId")
    void markAllAsRead(@Param("gymId") Long gymId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE n.gymId = :gymId AND n.id = :id")
    void deleteByGymIdAndId(@Param("gymId") Long gymId, @Param("id") Long id);
}
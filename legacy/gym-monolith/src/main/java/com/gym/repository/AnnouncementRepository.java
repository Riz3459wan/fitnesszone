package com.gym.repository;

import com.gym.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findByGymIdOrderByPinnedDescCreatedAtDesc(Long gymId);
    
    List<Announcement> findByGymIdAndTargetAudienceInOrderByPinnedDescCreatedAtDesc(Long gymId, List<String> audiences);
    
    @Modifying
    @Transactional
    @Query("UPDATE Announcement a SET a.pinned = false WHERE a.gymId = :gymId AND a.pinned = true")
    void unpinAllForGym(@Param("gymId") Long gymId);
}
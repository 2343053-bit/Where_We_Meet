package com.springboot.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.springboot.domain.Friendship;

public interface FriendshipRepository extends JpaRepository<Friendship, Long>{
    //메서드 이름 규칙에 따라 선언하면 Spring Data JPA가 이름을 분석해 쿼리 구현을 만들어준다
    
    //요청 존재 여부를 boolean으로 확인
    boolean existsByRequester_IdAndReceiver_Id(String requesterId, String receiverId);

    // 받은 대기 중 요청 목록을 List<Friendship>으로 조회
    List<Friendship> findByReceiver_IdAndAcceptedFalse(String receiverId);

    // 내가 보낸 수락된 친구 목록을 List<Friendship>으로 조회
    List<Friendship> findByRequester_IdAndAcceptedTrue(String requesterId);

    // 내가 받은 수락된 친구 목록을 List<Friendship>으로 조회
    List<Friendship> findByReceiver_IdAndAcceptedTrue(String receiverId);

    // 내가 보낸 요청이 수락된 목록을 List<Friendship>으로 조회
    @Query("""
        SELECT friendship FROM Friendship AS friendship
        WHERE friendship.accepted = true
        AND friendship.requester.id = :memberId""")
    List<Friendship> findAcceptedFriendshipsByRequesterId(@Param("memberId") String memberId);

    // 내가 받은 요청이 수락된 목록을 List<Friendship>으로 조회
    @Query("""
        SELECT friendship FROM Friendship AS friendship 
        WHERE friendship.accepted = true
        AND friendship.receiver.id = :memberId""")
    List<Friendship> findAcceptedFriendshipsByReceiverId(@Param("memberId") String memberId);

    // 친구 관계를 찾아서 Friendship으로 조회
    @Query("""
        SELECT friendship FROM Friendship friendship
        WHERE friendship.accepted = true
        AND (
            (friendship.requester.id = :myId AND friendship.receiver.id = :friendId)
            OR (friendship.requester.id = :friendId AND friendship.receiver.id = :myId)
        )
    """)
    Friendship findFriendship(@Param ("myId") String myId, @Param("friendId") String friendId);

    // 모든 친구 관계 삭제
    @Modifying //데이터를 변경하는 쿼리
    @Query("delete from Friendship f where f.requester.id = :memberId or f.receiver.id = :memberId")
    void deleteAllByMemberId(@Param("memberId") String memberId);
}

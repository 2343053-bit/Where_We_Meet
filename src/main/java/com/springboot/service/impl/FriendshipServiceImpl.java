package com.springboot.service.impl;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.domain.Friendship;
import com.springboot.domain.Member;
import com.springboot.repository.FriendshipRepository;
import com.springboot.repository.MemberRepository;
import com.springboot.service.FriendshipService;

@Service
@Transactional(readOnly = true)
public class FriendshipServiceImpl implements FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final MemberRepository memberRepository;

    public FriendshipServiceImpl(FriendshipRepository friendshipRepository, MemberRepository memberRepository) {
        this.friendshipRepository = friendshipRepository;
        this.memberRepository = memberRepository;
    }

    // 친구 요청 보내기
    @Transactional
    public Friendship sendRequest(String requesterId, String receiverId) {
        // 입력란이 null인지 확인
        if (receiverId == null) {
            throw new IllegalArgumentException("friend.error.emptyId");
        }

        // 공백 제거
        String targetId = receiverId.trim();

        // 공백인 경우 검사
        if (targetId.isEmpty()) {
            throw new IllegalArgumentException("friend.error.emptyId");
        }

        // 자기 자신에게 보내는 요청인지 확인
        if (requesterId.equals(targetId)) {
            throw new IllegalArgumentException("friend.error.selfRequest");
        }

        // 이미 친구인지 확인
        if (friendshipRepository.findFriendship(requesterId, targetId) != null) {
            throw new IllegalArgumentException("friend.error.alreadyFriends");
        }

        // 이미 대기 중인 요청이 있는지 확인
        if (friendshipRepository.existsByRequester_IdAndReceiver_Id(requesterId, targetId)
                || friendshipRepository.existsByRequester_IdAndReceiver_Id(targetId, requesterId)) {
            throw new IllegalArgumentException("friend.error.alreadyExists");
        }

        // 본인 ID가 없는 경우
        Member requester = memberRepository.findById(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("friend.error.memberNotFound"));

        // 친구 ID가 없는 경우
        Member receiver = memberRepository.findById(targetId)
                .orElseThrow(() -> new IllegalArgumentException("friend.error.targetNotFound"));

        Friendship friendship = new Friendship();
        friendship.setRequester(requester);
        friendship.setReceiver(receiver);
        friendship.setAccepted(false);

        return friendshipRepository.save(friendship);
    }

    // 받은 친구 요청 목록 조회
    public List<Friendship> getReceivedRequests(String receiverId) {
        return friendshipRepository.findByReceiver_IdAndAcceptedFalse(receiverId);
    }

    // 친구 요청 수락
    @Transactional
    public void acceptRequest(Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("친구 요청을 찾을 수 없습니다."));
            
        friendship.setAccepted(true);
    }

    // 친구 요청 거절
    @Transactional
    public void rejectRequest(Long friendshipId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("친구 요청을 찾을 수 없습니다."));

        friendshipRepository.delete(friendship);
    }

    // 친구 삭제
    @Transactional
    public void deleteFriend(String memberId, String friendId) {
        Friendship friendship = friendshipRepository.findFriendship(memberId, friendId);
        
        if(friendship == null){
            throw new IllegalArgumentException("해당하는 친구가 없습니다.");
        }

        friendshipRepository.delete(friendship);
    }
    
    // 내 친구 목록 조회
    public List<Member> getFriends(String memberId) {
        List<Member> friends = new ArrayList<>();
        
        List<Friendship> sentFriendships = friendshipRepository.findAcceptedFriendshipsByRequesterId(memberId);
        for (Friendship friendship : sentFriendships) {
            friends.add(friendship.getReceiver());
        }
        List<Friendship> receivedFriendships = friendshipRepository.findAcceptedFriendshipsByReceiverId(memberId);
        for (Friendship friendship : receivedFriendships) {
                friends.add(friendship.getRequester());
            }

        return friends;
    }
}
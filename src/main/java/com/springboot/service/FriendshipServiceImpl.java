package com.springboot.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.springboot.domain.Friendship;
import com.springboot.domain.Member;
import com.springboot.repository.FriendshipRepository;
import com.springboot.repository.MemberRepository;

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
        if (requesterId == null || receiverId == null || requesterId.equals(receiverId)) {
            throw new IllegalArgumentException("자신에게 친구 요청을 보낼 수 없습니다.");
        }

        // 1. 이미 친구(accepted = true)인 관계인지 먼저 확인
        if (friendshipRepository.findFriendship(requesterId, receiverId) != null) {
            throw new IllegalArgumentException("이미 친구입니다.");
        }

        // 2. 이미 대기 중(accepted = false)인 요청이 있는지 양방향 확인
        if (friendshipRepository.existsByRequester_IdAndReceiver_Id(requesterId, receiverId)
                || friendshipRepository.existsByRequester_IdAndReceiver_Id(receiverId, requesterId)) {
            throw new IllegalArgumentException("이미 친구 요청이 존재합니다.");
        }

        Member requester = memberRepository.findById(requesterId).orElse(null);
        if (requester == null) {
            throw new IllegalArgumentException("잘못된 요청입니다.");
        }

        Member receiver = memberRepository.findById(receiverId).orElse(null);
        if (receiver == null) {
            throw new IllegalArgumentException("수신자 회원을 찾을 수 없습니다.");
        }

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
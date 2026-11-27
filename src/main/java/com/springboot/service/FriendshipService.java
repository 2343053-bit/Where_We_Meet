package com.springboot.service;

import java.util.List;

import com.springboot.domain.Friendship;
import com.springboot.domain.Member;

public interface FriendshipService {

    // 친구 요청 보내기
    Friendship sendRequest(String requesterId, String receiverId);

    // 받은 친구 요청 목록 조회
    List<Friendship> getReceivedRequests(String receiverId);

    // 친구 요청 수락
    void acceptRequest(Long friendshipId);

    // 친구 요청 거절
    void rejectRequest(Long friendshipId);

    // 친구 삭제
    void deleteFriend(String memberId, String friendId);

    // 내 친구 목록 조회
    List<Member> getFriends(String memberId);
}
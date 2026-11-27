// 참가자 목록을 서버에 보내 중간 지점을 받아 온다.
// 응답: { meetingLatitude, meetingLongitude, adjusted, averageLatitude, averageLongitude, anchorName, anchorMissing }
export function fetchMeetingPoint(participants) {
    const token = document.querySelector('meta[name="_csrf"]').content;
    const header = document.querySelector('meta[name="_csrf_header"]').content;

    return fetch('/api/meeting-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [header]: token }, // [header] : 변수 값을 키 이름으로 쓴다.
        body: JSON.stringify(participants)
    }).then((response) => {
        if (!response.ok) throw new Error(`중간 지점 API 오류: ${response.status}`);
        return response.json();
    });
}
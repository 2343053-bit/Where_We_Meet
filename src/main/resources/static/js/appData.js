export function readAppData() {
    var appData = window.APP_DATA || {};
    return {
        meetingPoint: appData.meetingPoint || null,
        participants: appData.participants || []
    };
}
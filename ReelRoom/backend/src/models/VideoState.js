export var PlayState;
(function (PlayState) {
    PlayState["PLAYING"] = "PLAYING";
    PlayState["PAUSED"] = "PAUSED";
})(PlayState || (PlayState = {}));
export class VideoState {
    videoId;
    playState;
    currentTime; // position in seconds when last action occurred
    lastUpdated; // timestamp in epoch ms
    constructor(videoId = 'dQw4w9WgXcQ', playState = PlayState.PAUSED, currentTime = 0) {
        this.videoId = videoId;
        this.playState = playState;
        this.currentTime = currentTime;
        this.lastUpdated = Date.now();
    }
    /**
     * Calculates calculated current position in seconds considering time elapsed since last updated
     */
    getCurrentCalculatedTime() {
        if (this.playState === PlayState.PLAYING) {
            const elapsedSeconds = (Date.now() - this.lastUpdated) / 1000;
            return this.currentTime + elapsedSeconds;
        }
        return this.currentTime;
    }
    play(atTime) {
        if (atTime !== undefined) {
            this.currentTime = Math.max(0, atTime);
        }
        else {
            this.currentTime = this.getCurrentCalculatedTime();
        }
        this.playState = PlayState.PLAYING;
        this.lastUpdated = Date.now();
    }
    pause(atTime) {
        if (atTime !== undefined) {
            this.currentTime = Math.max(0, atTime);
        }
        else {
            this.currentTime = this.getCurrentCalculatedTime();
        }
        this.playState = PlayState.PAUSED;
        this.lastUpdated = Date.now();
    }
    seek(toTime) {
        this.currentTime = Math.max(0, toTime);
        this.lastUpdated = Date.now();
    }
    setVideo(videoId) {
        this.videoId = videoId;
        this.currentTime = 0;
        this.playState = PlayState.PAUSED;
        this.lastUpdated = Date.now();
    }
    getVideoId() {
        return this.videoId;
    }
    getPlayState() {
        return this.playState;
    }
    toJSON() {
        return {
            videoId: this.videoId,
            playState: this.playState,
            currentTime: this.getCurrentCalculatedTime(),
            lastUpdated: new Date(this.lastUpdated).toISOString()
        };
    }
}

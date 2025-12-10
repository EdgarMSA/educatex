// CÓDIGO DE VIDEO PLAYER Y 'MARCAR COMO VISTO'
import React from "react";
import ReactPlayer from "react-player";

const VideoPlayer = ({ url, onEnd }) => {
    if (!url) {
        return (
            <div className="flex items-center justify-center h-full text-red-400">
                Video no disponible
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black rounded-xl overflow-hidden">
            <ReactPlayer
                url={url}
                width="100%"
                height="100%"
                controls={true}
                onEnded={onEnd}
                playing={false}
                style={{ backgroundColor: "black" }}
            />
        </div>
    );
};

export default VideoPlayer;

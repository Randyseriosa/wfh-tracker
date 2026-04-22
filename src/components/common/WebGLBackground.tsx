import React from 'react';

/**
 * Static flat background component.
 * Replaced the previous WebGL implementation to improve performance and fix rendering issues.
 */
const WebGLBackground: React.FC = () => {
    return (
        <div
            className="fixed inset-0 w-full h-full z-0 pointer-events-none bg-base-100"
            aria-hidden="true"
        >
            {/* Subtle gradient overlay to keep the premium feel without WebGL overhead */}
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/5 opacity-50" />
        </div>
    );
};

export default WebGLBackground;

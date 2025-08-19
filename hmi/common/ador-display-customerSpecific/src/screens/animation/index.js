import React from "react";

import useWindowDimensions from "../../hooks/useWindowDimensions";

const AnimationPlayer = ({ useAnimation }) => {
  const { height, width } = useWindowDimensions();

  return (
    <video
      width={width}
      height={height}
      autoPlay
      loop
      muted
      data-testid="animation-player"
    >
      <source src={`/videos/${useAnimation?.video}`} />
    </video>
  );
};

export default AnimationPlayer;

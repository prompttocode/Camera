import React from 'react';
import { Canvas, Group, ColorMatrix, Rect, LinearGradient, vec } from '@shopify/react-native-skia';

const FilterThumbnail = ({ effect }) => {
  return (
    <Canvas style={{ width: 60, height: 60, borderRadius: 4, overflow: 'hidden' }}>
      <Group>
        <ColorMatrix matrix={effect.matrix} />
        <Rect x={0} y={0} width={60} height={60}>
          {/* A simple grayscale gradient is good for previewing color tints */}
          <LinearGradient
            start={vec(0, 0)}
            end={vec(60, 60)}
            colors={['#ffffff', '#aaaaaa', '#555555', '#000000']}
          />
        </Rect>
      </Group>
    </Canvas>
  );
};

export default FilterThumbnail;

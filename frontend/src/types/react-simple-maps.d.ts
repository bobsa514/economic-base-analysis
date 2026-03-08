/**
 * Type declarations for react-simple-maps.
 * This package does not ship its own types.
 */
declare module "react-simple-maps" {
  import { ComponentType, ReactNode, CSSProperties } from "react";

  interface ProjectionConfig {
    scale?: number;
    center?: [number, number];
    rotate?: [number, number, number];
    parallels?: [number, number];
  }

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: ProjectionConfig;
    width?: number;
    height?: number;
    className?: string;
    style?: CSSProperties;
    children?: ReactNode;
  }

  interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    translateExtent?: [[number, number], [number, number]];
    onMoveStart?: (event: object, position: object) => void;
    onMove?: (event: object, position: object) => void;
    onMoveEnd?: (event: object, position: object) => void;
    children?: ReactNode;
  }

  interface GeographiesProps {
    geography: string | object;
    children: (data: {
      geographies: GeographyType[];
    }) => ReactNode;
  }

  interface GeographyType {
    rsmKey: string;
    id: string | number;
    properties: Record<string, unknown>;
    type: string;
    geometry: object;
  }

  interface GeographyStyleProps {
    default?: CSSProperties;
    hover?: CSSProperties;
    pressed?: CSSProperties;
  }

  interface GeographyProps {
    geography: GeographyType;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: GeographyStyleProps;
    className?: string;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
    "aria-label"?: string;
    children?: ReactNode;
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
}

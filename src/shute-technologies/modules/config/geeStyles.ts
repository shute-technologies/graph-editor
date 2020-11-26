export class GEEStyles {

  static scrollbarHeight = 16;
  static backgroundColor = '#4e4e4e';

  // Controls: Styles
  static cStroke_Color = '#6e6e6e';
  static font_Color = '#f9f9f9';

  static arrowColor_Stroke = '#000000';
  static arrowColorFocus_Stroke = 'white';
  static arrowColor_Fill = '#6e6e6e';

  static graph = {
    startColor: '#9d9d9d',
    color: '#6d6d6d',
    mouseOverColor: '#3d3d3d',
    lineSize: 1,
    sizeX: 120,
    sizeY: 40,
    textStyle: 'bold 11px Arial',
    textOffsetX: 120 / 2,
    textOffsetY: 40 / 2,
    transition: {
      sizeY: 4
    },
    circleConnector: {
      radius: 5,
      offsetCircle: 5
    }
  };

  static scrollbar = {
    horizontalSize: 14,
    verticalSize: 30
  };

  private constructor() {}
}


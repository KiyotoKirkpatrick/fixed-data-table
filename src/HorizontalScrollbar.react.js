/**
 * @providesModule HorizontalScrollbar.react
 * @typechecks
 */
import React, { PureComponent } from 'react';
import { number, func } from 'prop-types';
import translateDOMPositionXY from 'translateDOMPositionXY';
import Scrollbar from 'Scrollbar.react';
import cx from 'cx';
import joinClasses from 'joinClasses';

const SCROLL_BAR_SIZE = Scrollbar.SIZE;
class HorizontalScrollbar extends PureComponent {
  static propTypes = {
    contentSize: number.isRequired,
    offset: number.isRequired,
    onScroll: func.isRequired,
    position: number.isRequired,
    size: number.isRequired
  };

  render() /*object*/ {
    const { size, offset, ...rest } = this.props;
    const outerContainerStyle = {
      height: SCROLL_BAR_SIZE,
      width: size
    };
    const innerContainerStyle = {
      height: SCROLL_BAR_SIZE,
      position: 'absolute',
      overflow: 'hidden',
      width: size
    };
    translateDOMPositionXY(innerContainerStyle, 0, offset);

    return (
      <div
        className={joinClasses(
          cx('fixedDataTableLayout/horizontalScrollbar'),
          cx('public/fixedDataTable/horizontalScrollbar')
        )}
        style={outerContainerStyle}
      >
        <div style={innerContainerStyle}>
          <Scrollbar
            {...rest}
            isOpaque={true}
            orientation="horizontal"
            size={size}
          />
        </div>
      </div>
    );
  }
}

module.exports = HorizontalScrollbar;

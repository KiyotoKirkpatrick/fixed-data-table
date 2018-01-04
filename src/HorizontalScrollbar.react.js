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
    var props = this.props;
    var size = props.size;
    var outerContainerStyle = {
      height: SCROLL_BAR_SIZE,
      width: size
    };
    var innerContainerStyle = {
      height: SCROLL_BAR_SIZE,
      position: 'absolute',
      overflow: 'hidden',
      width: size
    };
    translateDOMPositionXY(innerContainerStyle, 0, props.offset);

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
            {...props}
            isOpaque={true}
            orientation="horizontal"
            offset={undefined}
          />
        </div>
      </div>
    );
  }
}

module.exports = HorizontalScrollbar;

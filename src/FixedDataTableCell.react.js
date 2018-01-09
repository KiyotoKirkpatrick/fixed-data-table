/**
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableCell.react
 * @typechecks
 */

import React, { Component } from 'react';
import FixedDataTableCellDefault from 'FixedDataTableCellDefault.react';
import FixedDataTableHelper from 'FixedDataTableHelper';
import cx from 'cx';
import joinClasses from 'joinClasses';
import PropTypes from 'prop-types';

const DIR_SIGN = FixedDataTableHelper.DIR_SIGN;

const DEFAULT_PROPS = {
  align: 'left',
  highlighted: false
};

export class FixedDataTableCell extends Component {
  static displayName = 'FixedDataTableCell';

  /**
   * PropTypes are disabled in this component, because having them on slows
   * down the FixedDataTable hugely in DEV mode. You can enable them back for
   * development, but please don't commit this component with enabled propTypes.
   */
  static propTypes_DISABLED_FOR_PERFORMANCE = {
    isScrolling: PropTypes.bool,
    align: PropTypes.oneOf(['left', 'center', 'right']),
    className: PropTypes.string,
    highlighted: PropTypes.bool,
    width: PropTypes.number.isRequired,
    minWidth: PropTypes.number,
    maxWidth: PropTypes.number,
    height: PropTypes.number.isRequired,

    cell: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.element,
      PropTypes.func
    ]),
    columnKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

    /**
     * The row index that will be passed to `cellRenderer` to render.
     */
    rowIndex: PropTypes.number.isRequired,

    /**
     * Callback for when resizer knob (in FixedDataTableCell) is clicked
     * to initialize resizing. Please note this is only on the cells
     * in the header.
     * @param number combinedWidth
     * @param number left
     * @param number width
     * @param number minWidth
     * @param number maxWidth
     * @param number|string columnKey
     * @param object event
     */
    onColumnResize: PropTypes.func,

    /**
     * The left offset in pixels of the cell.
     */
    left: PropTypes.number
  };
  static defaultProps = DEFAULT_PROPS;

  shouldComponentUpdate(nextProps) {
    return !nextProps.isScrolling || this.props.rowIndex !== nextProps.rowIndex;
  }

  render() /*object*/ {
    const { height, width, columnKey, ...props } = this.props;

    const style = {
      height,
      width
    };

    if (DIR_SIGN === 1) {
      style.left = props.left;
    } else {
      style.right = props.left;
    }

    const className = joinClasses(
      cx({
        'fixedDataTableCellLayout/main': true,
        'fixedDataTableCellLayout/lastChild': props.lastChild,
        'fixedDataTableCellLayout/alignRight': props.align === 'right',
        'fixedDataTableCellLayout/alignCenter': props.align === 'center',
        'public/fixedDataTableCell/alignRight': props.align === 'right',
        'public/fixedDataTableCell/highlighted': props.highlighted,
        'public/fixedDataTableCell/main': true
      }),
      props.className
    );

    let columnResizerComponent;
    if (props.onColumnResize) {
      var columnResizerStyle = {
        height
      };
      columnResizerComponent = (
        <div
          className={cx('fixedDataTableCellLayout/columnResizerContainer')}
          style={columnResizerStyle}
          onMouseDown={this._onColumnResizerMouseDown}
        >
          <div
            className={joinClasses(
              cx('fixedDataTableCellLayout/columnResizerKnob'),
              cx('public/fixedDataTableCell/columnResizerKnob')
            )}
            style={columnResizerStyle}
          />
        </div>
      );
    }

    const cellProps = {
      columnKey,
      height,
      width
    };

    if (props.rowIndex >= 0) {
      cellProps.rowIndex = props.rowIndex;
    }

    let content;
    if (React.isValidElement(props.cell)) {
      content = React.cloneElement(props.cell, cellProps);
    } else if (typeof props.cell === 'function') {
      content = props.cell(cellProps);
    } else {
      content = (
        <FixedDataTableCellDefault {...cellProps}>
          {props.cell}
        </FixedDataTableCellDefault>
      );
    }

    return (
      <div className={className} style={style}>
        {columnResizerComponent}
        {content}
      </div>
    );
  }
  _onColumnResizerMouseDown = (/*object*/ event) => {
    const props = this.props;
    props.onColumnResize(
      props.left,
      props.width,
      props.minWidth,
      props.maxWidth,
      props.columnKey,
      event
    );
  };
}

export default FixedDataTableCell;

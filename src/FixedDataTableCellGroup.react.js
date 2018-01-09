/**
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableCellGroup.react
 * @typechecks
 */
import React, { Component } from 'react';
import FixedDataTableHelper from 'FixedDataTableHelper';
import FixedDataTableCell from 'FixedDataTableCell.react';

import cx from 'cx';
import translateDOMPositionXY from 'translateDOMPositionXY';
import { defaultMemoize } from 'memoize';
import FixedDataTableWidthHelper from 'FixedDataTableWidthHelper';
import PropTypes from 'prop-types';

const memoizedGetTotalWidth = defaultMemoize(
  FixedDataTableWidthHelper.getTotalWidth
);
const DIR_SIGN = FixedDataTableHelper.DIR_SIGN;
/*
  propTypes_DISABLED_FOR_PERFORMANCE: {
    columns: PropTypes.array.isRequired,

    isScrolling: PropTypes.bool,

    left: PropTypes.number,

    onColumnResize: PropTypes.func,

    rowHeight: PropTypes.number.isRequired,

    rowIndex: PropTypes.number.isRequired,

    width: PropTypes.number.isRequired,

    zIndex: PropTypes.number.isRequired
  },
*/
function FixedDataTableCellGroupImpl(props) {
  const { columns, left, width, height, zIndex } = props;
  const cells = new Array(columns.length);

  let currentPosition = 0;
  for (let i = 0, j = columns.length; i < j; i++) {
    const columnProps = columns[i].props;
    if (
      !columnProps.allowCellsRecycling ||
      (currentPosition - left <= width &&
        currentPosition - left + columnProps.width >= 0)
    ) {
      const key = 'cell_' + i;
      cells[i] = _renderCell(props, columnProps, currentPosition, key);
    }
    currentPosition += columnProps.width;
  }
  const contentWidth = memoizedGetTotalWidth(columns);

  const style = {
    height,
    position: 'absolute',
    width: contentWidth,
    zIndex
  };
  translateDOMPositionXY(style, -1 * DIR_SIGN * left, 0);

  return (
    <div
      className={cx('fixedDataTableCellGroupLayout/cellGroup')}
      style={style}
    >
      {cells}
    </div>
  );
}
FixedDataTableCellGroupImpl.displayName = 'FixedDataTableCellGroupImpl';

function _renderCell(
  /*object*/ props,
  /*object*/ columnProps,
  /*number*/ left,
  /*string*/ key
) /*object*/ {
  const cellIsResizable = columnProps.isResizable && props.onColumnResize;
  var onColumnResize = cellIsResizable ? props.onColumnResize : null;

  var className = columnProps.cellClassName;

  return (
    <FixedDataTableCell
      isScrolling={props.isScrolling}
      align={columnProps.align}
      className={className}
      height={props.height}
      key={key}
      maxWidth={columnProps.maxWidth}
      minWidth={columnProps.minWidth}
      onColumnResize={onColumnResize}
      rowIndex={props.rowIndex}
      columnKey={columnProps.columnKey}
      width={columnProps.width}
      left={left}
      cell={columnProps.cell}
    />
  );
}

export class FixedDataTableCellGroup extends Component {
  static displayName = 'FixedDataTableCellGroup';
  /**
   * PropTypes are disabled in this component, because having them on slows
   * down the FixedDataTable hugely in DEV mode. You can enable them back for
   * development, but please don't commit this component with enabled propTypes.
   */
  static propTypes_DISABLED_FOR_PERFORMANCE = {
    isScrolling: PropTypes.bool,
    /**
     * Height of the row.
     */
    height: PropTypes.number.isRequired,

    offsetLeft: PropTypes.number,

    left: PropTypes.number,
    /**
     * Z-index on which the row will be displayed. Used e.g. for keeping
     * header and footer in front of other rows.
     */
    zIndex: PropTypes.number.isRequired
  };
  static defaultProps = {
    offsetLeft: 0
  };
  shouldComponentUpdate(/*object*/ nextProps) /*boolean*/ {
    return (
      !nextProps.isScrolling ||
      this.props.rowIndex !== nextProps.rowIndex ||
      this.props.left !== nextProps.left
    );
  }
  render() /*object*/ {
    const { offsetLeft, ...props } = this.props;

    const style = {
      height: props.height
    };

    if (DIR_SIGN === 1) {
      style.left = offsetLeft;
    } else {
      style.right = offsetLeft;
    }
    const onColumnResize = props.onColumnResize ? this._onColumnResize : null;
    return (
      <div
        style={style}
        className={cx('fixedDataTableCellGroupLayout/cellGroupWrapper')}
      >
        {FixedDataTableCellGroupImpl({ ...props, onColumnResize })}
      </div>
    );
  }
  _onColumnResize = (
    /*number*/ cellLeft,
    /*number*/ width,
    /*?number*/ minWidth,
    /*?number*/ maxWidth,
    /*string|number*/ columnKey,
    /*object*/ event
  ) => {
    const { onColumnResize, offsetLeft, left } = this.props;
    onColumnResize &&
      onColumnResize(
        offsetLeft,
        cellLeft - left + width,
        width,
        minWidth,
        maxWidth,
        columnKey,
        event
      );
  };
}

export default FixedDataTableCellGroup;

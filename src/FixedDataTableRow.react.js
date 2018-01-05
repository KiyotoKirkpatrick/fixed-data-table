/**
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableRow.react
 * @typechecks
 */

import React, { Component } from 'react';
import FixedDataTableCellGroup from 'FixedDataTableCellGroup.react';
import joinClasses from 'joinClasses';
import translateDOMPositionXY from 'translateDOMPositionXY';
import { bool, number, array, func, string } from 'prop-types';
import { defaultMemoize } from 'memoize';
import { getTotalWidth } from 'FixedDataTableWidthHelper';
/**
 * Component that renders the row for <FixedDataTable />.
 * This component should not be used directly by developer. Instead,
 * only <FixedDataTable /> should use the component internally.
 */
const ODD_ROW_CLASS_NAMES =
  'fixedDataTableRowLayout_main public_fixedDataTableRow_highlighted ';
const EVEN_ROW_CLASS_NAMES = 'fixedDataTableRowLayout_main ';
const HAS_SHADOW_CLASS =
  'fixedDataTableRowLayout_fixedColumnsDivider fixedDataTableRowLayout_columnsShadow public_fixedDataTableRow_fixedColumnsDivider public_fixedDataTableRow_columnsShadow';
const NO_SHADOW_CLASS =
  'fixedDataTableRowLayout_fixedColumnsDivider public_fixedDataTableRow_fixedColumnsDivider';

const memoizedGetTotalWidth = defaultMemoize(getTotalWidth);
class FixedDataTableRow extends React.Component {
  static displayName = 'FixedDataTableRow';
  static propTypes = {
    isScrolling: bool,
    /**
     * The row index.
     */
    index: number.isRequired,
    /**
     * Width of the row.
     */
    width: number.isRequired,

    /**
     * Height of the row.
     */
    height: number.isRequired,
    /**
     * Array of <FixedDataTableColumn /> for the fixed columns.
     */
    fixedColumns: array.isRequired,
    /**
     * Array of <FixedDataTableColumn /> for the scrollable columns.
     */
    scrollableColumns: array.isRequired,

    /**
     * The distance between the left edge of the table and the leftmost portion
     * of the row currently visible in the table.
     */
    scrollLeft: number.isRequired,
    /**
     * Z-index on which the row will be displayed. Used e.g. for keeping
     * header and footer in front of other rows.
     */
    zIndex: number,

    /**
     * The vertical position where the row should render itself
     */
    offsetTop: number.isRequired,
    className: string,
    /**
     * Fire when a row is clicked.
     */
    onClick: func,

    /**
     * Fire when a row is double clicked.
     */
    onDoubleClick: func,
    /**
     * Fire when a row is double clicked.
     */
    onContextMenu: func,

    /**
     * Callback for when resizer knob (in FixedDataTableCell) is clicked
     * to initialize resizing. Please note this is only on the cells
     * in the header.
     * @param number combinedWidth
     * @param number leftOffset
     * @param number cellWidth
     * @param number|string columnKey
     * @param object event
     */
    onColumnResize: func
  };

  render() /*object*/ {
    const {
      isScrolling,
      index,
      zIndex,
      width,
      height,
      offsetTop,
      onColumnResize,
      fixedColumns,
      scrollableColumns,
      className,
      scrollLeft
    } = this.props;
    const style = {
      width,
      height,
      zIndex: zIndex ? zIndex : 0
    };
    translateDOMPositionXY(style, 0, offsetTop);

    const defaultClassName =
      index % 2 === 1 ? ODD_ROW_CLASS_NAMES : EVEN_ROW_CLASS_NAMES;

    const fixedColumnsWidth = memoizedGetTotalWidth(fixedColumns);
    const fixedColumnGroup = (
      <FixedDataTableCellGroup
        key="fixed_cells"
        isScrolling={isScrolling}
        height={height}
        left={0}
        width={fixedColumnsWidth}
        zIndex={2}
        columns={fixedColumns}
        onColumnResize={onColumnResize}
        rowHeight={height}
        rowIndex={index}
      />
    );
    const columnsShadow = this._renderColumnsShadow(fixedColumnsWidth);
    const scrollableColumnGroup = (
      <FixedDataTableCellGroup
        key="scrollable_cells"
        isScrolling={isScrolling}
        height={height}
        left={scrollLeft}
        offsetLeft={fixedColumnsWidth}
        width={width - fixedColumnsWidth}
        zIndex={0}
        columns={scrollableColumns}
        onColumnResize={onColumnResize}
        rowHeight={height}
        rowIndex={index}
      />
    );
    return (
      <div
        style={style}
        className={joinClasses(
          defaultClassName,
          className,
          'fixedDataTableRowLayout_rowWrapper'
        )}
        onClick={this._onClick}
        onDoubleClick={this._onDoubleClick}
        onMouseDown={this._onMouseDown}
        onMouseEnter={this._onMouseEnter}
        onMouseLeave={this._onMouseLeave}
        onContextMenu={this._onContextMenu}
      >
        {fixedColumnGroup}
        {scrollableColumnGroup}
        {columnsShadow}
      </div>
    );
  }

  _onClick = (/*object*/ event) => {
    const { onClick, index } = this.props;
    if (onClick) {
      onClick(event, index);
    }
  };

  _onDoubleClick = (/*object*/ event) => {
    const { onDoubleClick, index } = this.props;
    if (onDoubleClick) {
      onDoubleClick(event, index);
    }
  };

  _onMouseDown = (/*object*/ event) => {
    const { onMouseDown, index } = this.props;
    if (onMouseDown) {
      onMouseDown(event, index);
    }
  };

  _onMouseEnter = (/*object*/ event) => {
    const { onMouseEnter, index } = this.props;
    if (onMouseEnter) {
      onMouseEnter(event, index);
    }
  };

  _onMouseLeave = (/*object*/ event) => {
    const { onMouseLeave, index } = this.props;
    if (onMouseLeave) {
      onMouseLeave(event, index);
    }
  };
  _onContextMenu = (/*object*/ event) => {
    const { onContextMenu, index } = this.props;
    if (onContextMenu) {
      onContextMenu(event, index);
    }
  };
  _renderColumnsShadow(/*number*/ left) /*?object*/ {
    if (left > 0) {
      const { scrollLeft, height } = this.props;
      var className = scrollLeft > 0 ? HAS_SHADOW_CLASS : NO_SHADOW_CLASS;
      return <div className={className} style={{ left, height }} />;
    }
    return null;
  }
}

module.exports = FixedDataTableRow;

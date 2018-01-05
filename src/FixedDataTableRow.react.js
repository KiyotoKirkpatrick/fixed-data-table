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

'use strict';

var React = require('React');
var createReactClass = require('create-react-class');
var FixedDataTableCellGroup = require('FixedDataTableCellGroup.react');

var cx = require('cx');
var joinClasses = require('joinClasses');
var translateDOMPositionXY = require('translateDOMPositionXY');

var PropTypes = require('prop-types');

/**
 * Component that renders the row for <FixedDataTable />.
 * This component should not be used directly by developer. Instead,
 * only <FixedDataTable /> should use the component internally.
 */
const ODD_ROW_CLASS_NAMES =
  'fixedDataTableRowLayout_main public_fixedDataTableRow_main public_fixedDataTableRow_highlighted public_fixedDataTableRow_odd ';
const EVEN_ROW_CLASS_NAMES =
  'fixedDataTableRowLayout_main public_fixedDataTableRow_main public_fixedDataTableRow_even ';
const HAS_SHADOW_CLASS =
  'fixedDataTableRowLayout_fixedColumnsDivider fixedDataTableRowLayout_columnsShadow public_fixedDataTableRow_fixedColumnsDivider public_fixedDataTableRow_columnsShadow';
const NO_SHADOW_CLASS =
  'fixedDataTableRowLayout_fixedColumnsDivider public_fixedDataTableRow_fixedColumnsDivider';

var FixedDataTableRowImpl = createReactClass({
  displayName: 'FixedDataTableRowImpl',
  propTypes: {
    isScrolling: PropTypes.bool,

    /**
     * Array of <FixedDataTableColumn /> for the fixed columns.
     */
    fixedColumns: PropTypes.array.isRequired,

    /**
     * Height of the row.
     */
    height: PropTypes.number.isRequired,

    /**
     * The row index.
     */
    index: PropTypes.number.isRequired,

    /**
     * Array of <FixedDataTableColumn /> for the scrollable columns.
     */
    scrollableColumns: PropTypes.array.isRequired,

    /**
     * The distance between the left edge of the table and the leftmost portion
     * of the row currently visible in the table.
     */
    scrollLeft: PropTypes.number.isRequired,

    /**
     * Width of the row.
     */
    width: PropTypes.number.isRequired,

    /**
     * Fire when a row is clicked.
     */
    onClick: PropTypes.func,

    /**
     * Fire when a row is double clicked.
     */
    onDoubleClick: PropTypes.func,
    /**
     * Fire when a row is double clicked.
     */
    onContextMenu: PropTypes.func,

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
    onColumnResize: PropTypes.func
  },

  render() /*object*/ {
    const props = this.props;
    const {
      height,
      width,
      index,
      isScrolling,
      onColumnResize,
      fixedColumns,
      scrollableColumns,
      className,
      scrollLeft
    } = props;
    var defaultClassName =
      index % 2 === 1 ? ODD_ROW_CLASS_NAMES : EVEN_ROW_CLASS_NAMES;

    var fixedColumnsWidth = this._getColumnsWidth(fixedColumns);
    var fixedColumnGroup = (
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
    var columnsShadow = this._renderColumnsShadow(fixedColumnsWidth);
    var scrollableColumnGroup = (
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
        className={joinClasses(defaultClassName, className)}
        onClick={this._onClick}
        onDoubleClick={this._onDoubleClick}
        onMouseDown={this._onMouseDown}
        onMouseEnter={this._onMouseEnter}
        onMouseLeave={this._onMouseLeave}
        onContextMenu={this._onContextMenu}
        style={{ width, height }}
      >
        <div className={cx('fixedDataTableRowLayout/body')}>
          {fixedColumnGroup}
          {scrollableColumnGroup}
          {columnsShadow}
        </div>
      </div>
    );
  },

  _getColumnsWidth(/*array*/ columns) /*number*/ {
    var width = 0;
    for (var i = 0; i < columns.length; ++i) {
      width += columns[i].props.width;
    }
    return width;
  },

  _renderColumnsShadow(/*number*/ left) /*?object*/ {
    if (left > 0) {
      var props = this.props;
      var scrollLeft = props.scrollLeft;
      var className = scrollLeft > 0 ? HAS_SHADOW_CLASS : NO_SHADOW_CLASS;
      var style = {
        left: left,
        height: props.height
      };
      return <div className={className} style={style} />;
    }
  },

  _onClick(/*object*/ event) {
    const { onClick, index } = this.props;
    if (onClick) {
      onClick(event, index);
    }
  },

  _onDoubleClick(/*object*/ event) {
    const { onDoubleClick, index } = this.props;
    if (onDoubleClick) {
      onDoubleClick(event, index);
    }
  },

  _onMouseDown(/*object*/ event) {
    const { onMouseDown, index } = this.props;
    if (onMouseDown) {
      onMouseDown(event, index);
    }
  },

  _onMouseEnter(/*object*/ event) {
    const { onMouseEnter, index } = this.props;
    if (onMouseEnter) {
      onMouseEnter(event, index);
    }
  },

  _onMouseLeave(/*object*/ event) {
    const { onMouseLeave, index } = this.props;
    if (onMouseLeave) {
      onMouseLeave(event, index);
    }
  },
  _onContextMenu(/*object*/ event) {
    const { onContextMenu, index } = this.props;
    if (onContextMenu) {
      onContextMenu(event, index);
    }
  }
});

var FixedDataTableRow = createReactClass({
  displayName: 'FixedDataTableRow',
  propTypes: {
    isScrolling: PropTypes.bool,

    /**
     * Height of the row.
     */
    height: PropTypes.number.isRequired,

    /**
     * Z-index on which the row will be displayed. Used e.g. for keeping
     * header and footer in front of other rows.
     */
    zIndex: PropTypes.number,

    /**
     * The vertical position where the row should render itself
     */
    offsetTop: PropTypes.number.isRequired,

    /**
     * Width of the row.
     */
    width: PropTypes.number.isRequired
  },

  render() /*object*/ {
    var props = this.props;
    var style = {
      width: props.width,
      height: props.height,
      zIndex: props.zIndex ? props.zIndex : 0
    };
    translateDOMPositionXY(style, 0, props.offsetTop);

    return (
      <div style={style} className={cx('fixedDataTableRowLayout/rowWrapper')}>
        <FixedDataTableRowImpl
          {...props}
          offsetTop={undefined}
          zIndex={undefined}
        />
      </div>
    );
  }
});

module.exports = FixedDataTableRow;

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

    var defaultClassName = cx({
      'fixedDataTableRowLayout/main': true,
      'public/fixedDataTableRow/main': true,
      'public/fixedDataTableRow/highlighted': index % 2 === 1,
      'public/fixedDataTableRow/odd': index % 2 === 1,
      'public/fixedDataTableRow/even': index % 2 === 0
    });

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
        onClick={props.onClick ? this._onClick : null}
        onDoubleClick={props.onDoubleClick ? this._onDoubleClick : null}
        onMouseDown={props.onMouseDown ? this._onMouseDown : null}
        onMouseEnter={props.onMouseEnter ? this._onMouseEnter : null}
        onMouseLeave={props.onMouseLeave ? this._onMouseLeave : null}
        onContextMenu={props.onContextMenu ? this._onContextMenu : null}
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
      var className = cx({
        'fixedDataTableRowLayout/fixedColumnsDivider': true,
        'fixedDataTableRowLayout/columnsShadow': scrollLeft > 0,
        'public/fixedDataTableRow/fixedColumnsDivider': true,
        'public/fixedDataTableRow/columnsShadow': scrollLeft > 0
      });
      var style = {
        left: left,
        height: props.height
      };
      return <div className={className} style={style} />;
    }
  },

  _onClick(/*object*/ event) {
    this.props.onClick(event, this.props.index);
  },

  _onDoubleClick(/*object*/ event) {
    this.props.onDoubleClick(event, this.props.index);
  },

  _onMouseDown(/*object*/ event) {
    this.props.onMouseDown(event, this.props.index);
  },

  _onMouseEnter(/*object*/ event) {
    this.props.onMouseEnter(event, this.props.index);
  },

  _onMouseLeave(/*object*/ event) {
    this.props.onMouseLeave(event, this.props.index);
  },
  _onContextMenu(/*object*/ event) {
    this.props.onContextMenu(event, this.props.index);
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

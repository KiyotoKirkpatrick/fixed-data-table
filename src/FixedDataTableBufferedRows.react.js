/**
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTableBufferedRows.react
 * @typechecks
 */

var React = require('React');
var createReactClass = require('create-react-class');
var FixedDataTableRowBuffer = require('FixedDataTableRowBuffer');
var FixedDataTableRow = require('FixedDataTableRow.react');

var cx = require('cx');
var emptyFunction = require('emptyFunction');
var joinClasses = require('joinClasses');
var translateDOMPositionXY = require('translateDOMPositionXY');

var PropTypes = require('prop-types');

var FixedDataTableBufferedRows = createReactClass({
  displayName: 'FixedDataTableBufferedRows',
  propTypes: {
    isScrolling: PropTypes.bool,
    defaultRowHeight: PropTypes.number.isRequired,
    firstRowIndex: PropTypes.number.isRequired,
    firstRowOffset: PropTypes.number.isRequired,
    fixedColumns: PropTypes.array.isRequired,
    height: PropTypes.number.isRequired,
    offsetTop: PropTypes.number.isRequired,
    onRowClick: PropTypes.func,
    onRowDoubleClick: PropTypes.func,
    onRowMouseDown: PropTypes.func,
    onRowMouseEnter: PropTypes.func,
    onRowMouseLeave: PropTypes.func,
    onRowContextMenu: PropTypes.func,
    rowClassNameGetter: PropTypes.func,
    rowsCount: PropTypes.number.isRequired,
    rowHeightGetter: PropTypes.func,
    rowPositionGetter: PropTypes.func.isRequired,
    scrollLeft: PropTypes.number.isRequired,
    scrollableColumns: PropTypes.array.isRequired,
    showLastRowBorder: PropTypes.bool,
    width: PropTypes.number.isRequired
  },

  getInitialState() /*object*/ {
    this._rowBuffer = new FixedDataTableRowBuffer(
      this.props.rowsCount,
      this.props.defaultRowHeight,
      this.props.height,
      this._getRowHeight
    );
    return {
      rowsToRender: this._rowBuffer.getRows(
        this.props.firstRowIndex,
        this.props.firstRowOffset
      )
    };
  },

  componentWillMount() {
    this._staticRowArray = [];
  },

  componentDidMount() {
    setTimeout(this._updateBuffer, 1000);
  },

  componentWillReceiveProps(/*object*/ nextProps) {
    var props = this.props;
    if (
      nextProps.rowsCount !== props.rowsCount ||
      nextProps.defaultRowHeight !== props.defaultRowHeight ||
      nextProps.height !== props.height
    ) {
      this._rowBuffer = new FixedDataTableRowBuffer(
        nextProps.rowsCount,
        nextProps.defaultRowHeight,
        nextProps.height,
        this._getRowHeight
      );
    }
    if (props.isScrolling && !nextProps.isScrolling) {
      this._updateBuffer();
    } else {
      this.setState({
        rowsToRender: this._rowBuffer.getRows(
          nextProps.firstRowIndex,
          nextProps.firstRowOffset
        )
      });
    }
  },

  _updateBuffer() {
    this.setState({
      rowsToRender: this._rowBuffer.getRowsWithUpdatedBuffer()
    });
  },

  shouldComponentUpdate() /*boolean*/ {
    // Don't add PureRenderMixin to this component please.
    return true;
  },

  componentWillUnmount() {
    this._staticRowArray.length = 0;
  },

  render() /*object*/ {
    var props = this.props;
    var rowClassNameGetter = props.rowClassNameGetter || emptyFunction;
    var rowPositionGetter = props.rowPositionGetter;

    var rowsToRender = this.state.rowsToRender;
    this._staticRowArray.length = rowsToRender.length;
    var rowsCount = props.rowsCount;
    var isScrolling = props.isScrolling;
    var width = props.width;
    var scrollLeft = Math.round(props.scrollLeft);
    var fixedColumns = props.fixedColumns;
    var scrollableColumns = props.scrollableColumns;
    var onRowClick = props.onRowClick;
    var onRowDoubleClick = props.onRowDoubleClick;
    var onRowContextMenu = props.onRowContextMenu;
    var onRowMouseDown = props.onRowMouseDown;
    var onRowMouseEnter = props.onRowMouseEnter;
    var onRowMouseLeave = props.onRowMouseLeave;
    var showLastRowBorder = props.showLastRowBorder;
    for (var i = 0; i < rowsToRender.length; ++i) {
      var rowIndex = rowsToRender[i];
      var currentRowHeight = this._getRowHeight(rowIndex);
      var rowOffsetTop = rowPositionGetter(rowIndex);

      var hasBottomBorder = rowIndex === rowsCount - 1 && showLastRowBorder;

      this._staticRowArray[i] = (
        <FixedDataTableRow
          key={i}
          isScrolling={isScrolling}
          index={rowIndex}
          width={width}
          height={currentRowHeight}
          scrollLeft={scrollLeft}
          offsetTop={Math.round(rowOffsetTop)}
          fixedColumns={fixedColumns}
          scrollableColumns={scrollableColumns}
          onClick={onRowClick}
          onDoubleClick={onRowDoubleClick}
          onMouseDown={onRowMouseDown}
          onMouseEnter={onRowMouseEnter}
          onMouseLeave={onRowMouseLeave}
          onContextMenu={onRowContextMenu}
          className={joinClasses(
            rowClassNameGetter(rowIndex),
            cx('public/fixedDataTable/bodyRow'),
            cx({
              'fixedDataTableLayout/hasBottomBorder': hasBottomBorder,
              'public/fixedDataTable/hasBottomBorder': hasBottomBorder
            })
          )}
        />
      );
    }

    var firstRowPosition = props.rowPositionGetter(props.firstRowIndex);

    var style = {
      position: 'absolute',
      pointerEvents: props.isScrolling ? 'none' : 'auto'
    };

    translateDOMPositionXY(
      style,
      0,
      props.firstRowOffset - firstRowPosition + props.offsetTop
    );

    return <div style={style}>{this._staticRowArray}</div>;
  },

  _getRowHeight(/*number*/ index) /*number*/ {
    var props = this.props;
    var rowHeightGetter = props.rowHeightGetter;
    return rowHeightGetter ? rowHeightGetter(index) : props.defaultRowHeight;
  }
});

module.exports = FixedDataTableBufferedRows;

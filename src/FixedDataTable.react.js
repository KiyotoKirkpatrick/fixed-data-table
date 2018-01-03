/**
 * Copyright (c) 2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule FixedDataTable.react
 * @typechecks
 * @noflow
 */

/*eslint no-bitwise:1*/

var React = require('React');
var createReactClass = require('create-react-class');
var ReactComponentWithPureRenderMixin = require('ReactComponentWithPureRenderMixin');
var ReactWheelHandler = require('ReactWheelHandler');
var ReactTouchHandler = require('ReactTouchHandler');
var Scrollbar = require('Scrollbar.react');
var FixedDataTableBufferedRows = require('FixedDataTableBufferedRows.react');
var FixedDataTableColumnResizeHandle = require('FixedDataTableColumnResizeHandle.react');
var FixedDataTableRow = require('FixedDataTableRow.react');
var FixedDataTableScrollHelper = require('FixedDataTableScrollHelper');
var FixedDataTableWidthHelper = require('FixedDataTableWidthHelper');

var cx = require('cx');
var debounceCore = require('debounceCore');
var emptyFunction = require('emptyFunction');
var invariant = require('invariant');
var joinClasses = require('joinClasses');
var shallowEqual = require('shallowEqual');
var translateDOMPositionXY = require('translateDOMPositionXY');

var PropTypes = require('prop-types');
var ReactChildren = React.Children;

var EMPTY_OBJECT = {};
var BORDER_HEIGHT = 1;
var HEADER = 'header';
var FOOTER = 'footer';
var CELL = 'cell';

/**
 * Data grid component with fixed or scrollable header and columns.
 *
 * The layout of the data table is as follows:
 *
 * ```
 * +---------------------------------------------------+
 * | Fixed Column Group    | Scrollable Column Group   |
 * | Header                | Header                    |
 * |                       |                           |
 * +---------------------------------------------------+
 * |                       |                           |
 * | Fixed Header Columns  | Scrollable Header Columns |
 * |                       |                           |
 * +-----------------------+---------------------------+
 * |                       |                           |
 * | Fixed Body Columns    | Scrollable Body Columns   |
 * |                       |                           |
 * +-----------------------+---------------------------+
 * |                       |                           |
 * | Fixed Footer Columns  | Scrollable Footer Columns |
 * |                       |                           |
 * +-----------------------+---------------------------+
 * ```
 *
 * - Fixed Column Group Header: These are the headers for a group
 *   of columns if included in the table that do not scroll
 *   vertically or horizontally.
 *
 * - Scrollable Column Group Header: The header for a group of columns
 *   that do not move while scrolling vertically, but move horizontally
 *   with the horizontal scrolling.
 *
 * - Fixed Header Columns: The header columns that do not move while scrolling
 *   vertically or horizontally.
 *
 * - Scrollable Header Columns: The header columns that do not move
 *   while scrolling vertically, but move horizontally with the horizontal
 *   scrolling.
 *
 * - Fixed Body Columns: The body columns that do not move while scrolling
 *   horizontally, but move vertically with the vertical scrolling.
 *
 * - Scrollable Body Columns: The body columns that move while scrolling
 *   vertically or horizontally.
 */
const SCROLL_BAR_SIZE = Scrollbar.SIZE;
var FixedDataTable = createReactClass({
  displayName: 'FixedDataTable',
  propTypes: {
    /**
     * Pixel width of table. If all columns do not fit,
     * a horizontal scrollbar will appear.
     */
    width: PropTypes.number.isRequired,

    /**
     * Pixel height of table. If all rows do not fit,
     * a vertical scrollbar will appear.
     *
     * Either `height` or `maxHeight` must be specified.
     */
    height: PropTypes.number,

    /**
     * Maximum pixel height of table. If all rows do not fit,
     * a vertical scrollbar will appear.
     *
     * Either `height` or `maxHeight` must be specified.
     */
    maxHeight: PropTypes.number,

    /**
     * Pixel height of table's owner, this is used in a managed scrolling
     * situation when you want to slide the table up from below the fold
     * without having to constantly update the height on every scroll tick.
     * Instead, vary this property on scroll. By using `ownerHeight`, we
     * over-render the table while making sure the footer and horizontal
     * scrollbar of the table are visible when the current space for the table
     * in view is smaller than the final, over-flowing height of table. It
     * allows us to avoid resizing and reflowing table when it is moving in the
     * view.
     *
     * This is used if `ownerHeight < height` (or `maxHeight`).
     */
    ownerHeight: PropTypes.number,

    overflowX: PropTypes.oneOf(['hidden', 'auto']),
    overflowY: PropTypes.oneOf(['hidden', 'auto']),

    /**
     * Number of rows in the table.
     */
    rowsCount: PropTypes.number.isRequired,

    /**
     * Pixel height of rows unless `rowHeightGetter` is specified and returns
     * different value.
     */
    rowHeight: PropTypes.number.isRequired,

    /**
     * If specified, `rowHeightGetter(index)` is called for each row and the
     * returned value overrides `rowHeight` for particular row.
     */
    rowHeightGetter: PropTypes.func,

    /**
     * To get any additional CSS classes that should be added to a row,
     * `rowClassNameGetter(index)` is called.
     */
    rowClassNameGetter: PropTypes.func,

    /**
     * Pixel height of the column group header.
     */
    groupHeaderHeight: PropTypes.number,

    /**
     * Pixel height of header.
     */
    headerHeight: PropTypes.number.isRequired,

    /**
     * Pixel height of footer.
     */
    footerHeight: PropTypes.number,

    /**
     * Value of horizontal scroll.
     */
    scrollLeft: PropTypes.number,

    /**
     * Index of column to scroll to.
     */
    scrollToColumn: PropTypes.number,

    /**
     * Value of vertical scroll.
     */
    scrollTop: PropTypes.number,

    /**
     * Index of row to scroll to.
     */
    scrollToRow: PropTypes.number,
    /**
     * Callback when horizontally scrolling the grid.
     *
     * Return false to stop propagation.
     */
    onHorizontalScroll: PropTypes.func,

    /**
     * Callback when vertically scrolling the grid.
     *
     * Return false to stop propagation.
     */
    onVerticalScroll: PropTypes.func,
    /**
     * Callback that is called when scrolling starts with current horizontal
     * and vertical scroll values.
     */
    onScrollStart: PropTypes.func,

    /**
     * Callback that is called when scrolling ends or stops with new horizontal
     * and vertical scroll values.
     */
    onScrollEnd: PropTypes.func,

    /**
     * Callback that is called when `rowHeightGetter` returns a different height
     * for a row than the `rowHeight` prop. This is necessary because initially
     * table estimates heights of some parts of the content.
     */
    onContentHeightChange: PropTypes.func,
    /**
     * Callback that is called when `width` change or column(s) have been added/removed
     */
    onMaxScrollXChange: PropTypes.func,
    /**
     * Callback that is called when `rowHeightGetter` returns a different height
     * for a row than the `rowHeight` prop or rows have been added/removed
     */
    onMaxScrollYChange: PropTypes.func,
    /**
     * Callback that is called when first row index changes.
     */
    onFirstRowIndexChange: PropTypes.func,
    /**
     * Callback that is called when a row is clicked.
     */
    onRowClick: PropTypes.func,

    /**
     * Callback that is called when a row is double clicked.
     */
    onRowDoubleClick: PropTypes.func,

    /**
     * Callback that is called when a mouse-down event happens on a row.
     */
    onRowMouseDown: PropTypes.func,

    /**
     * Callback that is called when a mouse-enter event happens on a row.
     */
    onRowMouseEnter: PropTypes.func,

    /**
     * Callback that is called when a mouse-leave event happens on a row.
     */
    onRowMouseLeave: PropTypes.func,

    /**
     * Callback that is called when resizer has been released
     * and column needs to be updated.
     *
     * Required if the isResizable property is true on any column.
     *
     * ```
     * function(
     *   newColumnWidth: number,
     *   columnKey: string,
     * )
     * ```
     */
    onColumnResizeEndCallback: PropTypes.func,

    /**
     * Whether a column is currently being resized.
     */
    isColumnResizing: PropTypes.bool
  },

  getDefaultProps() /*object*/ {
    return {
      footerHeight: 0,
      groupHeaderHeight: 0,
      headerHeight: 0,
      scrollLeft: 0,
      scrollTop: 0
    };
  },

  getInitialState() /*object*/ {
    var props = this.props;
    var viewportHeight =
      (props.height === undefined ? props.maxHeight : props.height) -
      (props.headerHeight || 0) -
      (props.footerHeight || 0) -
      (props.groupHeaderHeight || 0);
    this._scrollHelper = new FixedDataTableScrollHelper(
      props.rowsCount,
      props.rowHeight,
      viewportHeight,
      props.rowHeightGetter
    );
    if (props.scrollTop) {
      this._scrollHelper.scrollTo(props.scrollTop);
    }
    this._didScrollStop = debounceCore(this._didScrollStopSync, 200, this);
    return this._calculateState(this.props);
  },

  componentWillMount() {
    var props = this.props;
    var scrollToRow = props.scrollToRow;
    if (scrollToRow !== undefined && scrollToRow !== null) {
      this._rowToScrollTo = scrollToRow;
    }
    var scrollToColumn = props.scrollToColumn;
    if (scrollToColumn !== undefined && scrollToColumn !== null) {
      this._columnToScrollTo = scrollToColumn;
    }
    this._wheelHandler = new ReactWheelHandler(
      this._onWheel,
      this._shouldHandleWheelX,
      this._shouldHandleWheelY
    );
    this._touchHandler = new ReactTouchHandler(
      this._onWheel,
      this._shouldHandleTouchX,
      this._shouldHandleTouchY,
      props.stopScrollPropagation
    );
  },

  _shouldHandleWheelX(/*number*/ delta) /*boolean*/ {
    if (this.props.overflowX === 'hidden') {
      return false;
    }

    delta = Math.round(delta);
    if (delta === 0) {
      return false;
    }
    var state = this.state;
    var scrollX = state.scrollX;
    return (
      (delta < 0 && scrollX > 0) || (delta >= 0 && scrollX < state.maxScrollX)
    );
  },

  _shouldHandleWheelY(/*number*/ delta) /*boolean*/ {
    if (this.props.overflowY === 'hidden' || delta === 0) {
      return false;
    }

    delta = Math.round(delta);
    if (delta === 0) {
      return false;
    }
    var state = this.state;
    var scrollY = state.scrollY;
    return (
      (delta < 0 && scrollY > 0) || (delta >= 0 && scrollY < state.maxScrollY)
    );
  },
  _shouldHandleTouchX(/*number*/ delta) /*boolean*/ {
    return this.props.touchScrollEnabled && this._shouldHandleWheelX(delta);
  },

  _shouldHandleTouchY(/*number*/ delta) /*boolean*/ {
    return this.props.touchScrollEnabled && this._shouldHandleWheelY(delta);
  },
  _reportContentHeight() {
    var state = this.state;
    var scrollContentHeight = state.scrollContentHeight;
    var reservedHeight = state.reservedHeight;
    var requiredHeight = scrollContentHeight + reservedHeight;
    var contentHeight;
    var props = this.props;
    var useMaxHeight = props.height === undefined;
    if (useMaxHeight && props.maxHeight > requiredHeight) {
      contentHeight = requiredHeight;
    } else if (state.height > requiredHeight && props.ownerHeight) {
      contentHeight = Math.max(requiredHeight, props.ownerHeight);
    } else {
      contentHeight = state.height + state.maxScrollY;
    }
    if (contentHeight !== this._contentHeight && props.onContentHeightChange) {
      props.onContentHeightChange(contentHeight);
    }
    this._contentHeight = contentHeight;
  },
  _reportScrollState(prevState) {
    const state = this.state;
    const props = this.props;
    const initialRender = prevState === undefined;
    if (
      (initialRender || state.maxScrollX !== prevState.maxScrollX) &&
      props.onMaxScrollXChange
    ) {
      props.onMaxScrollXChange(state.maxScrollX);
    }
    if (
      (initialRender || state.maxScrollY !== prevState.maxScrollY) &&
      props.onMaxScrollYChange
    ) {
      props.onMaxScrollYChange(state.maxScrollY);
    }
    if (
      (initialRender || state.firstRowIndex !== prevState.firstRowIndex) &&
      props.onFirstRowIndexChange
    ) {
      props.onFirstRowIndexChange(state.firstRowIndex);
    }
  },

  componentDidMount() {
    this._reportContentHeight();
    this._reportScrollState();
  },

  componentWillReceiveProps(/*object*/ nextProps) {
    var scrollToRow = nextProps.scrollToRow;
    const props = this.props;
    if (scrollToRow !== undefined && scrollToRow !== null) {
      this._rowToScrollTo = scrollToRow;
    }
    var scrollToColumn = nextProps.scrollToColumn;
    if (scrollToColumn !== undefined && scrollToColumn !== null) {
      this._columnToScrollTo = scrollToColumn;
    }

    var newOverflowX = nextProps.overflowX;
    var newOverflowY = nextProps.overflowY;
    if (newOverflowX !== props.overflowX || newOverflowY !== props.overflowY) {
      this._wheelHandler = new ReactWheelHandler(
        this._onWheel,
        newOverflowX !== 'hidden', // Should handle horizontal scroll
        newOverflowY !== 'hidden' // Should handle vertical scroll
      );
    }

    // In the case of controlled scrolling, notify.
    if (
      props.ownerHeight !== nextProps.ownerHeight ||
      props.scrollTop !== nextProps.scrollTop
    ) {
      this._didScrollStart();
    }
    // Cancel any pending debounced scroll handling and handle immediately.
    this._didScrollStop.reset();
    this._didScrollStopSync();
    this.setState(this._calculateState(nextProps, this.state));
  },

  componentDidUpdate(prevProps, prevState) {
    this._reportContentHeight();
    this._reportScrollState(prevState);
  },

  render() /*object*/ {
    const state = this.state;
    const props = this.props;
    const {
      scrollX,
      scrollY,
      width,
      height,
      maxScrollX,
      maxScrollY,
      footerHeight,
      headerHeight,
      ownerHeight,
      groupHeaderHeight
    } = state;
    let groupHeader;
    if (state.useGroupHeader) {
      groupHeader = (
        <FixedDataTableRow
          key="group_header"
          isScrolling={this._isScrolling}
          className={joinClasses(
            cx('fixedDataTableLayout/header'),
            cx('public/fixedDataTable/header')
          )}
          width={width}
          height={groupHeaderHeight}
          index={0}
          zIndex={1}
          offsetTop={0}
          scrollLeft={scrollX}
          fixedColumns={state.groupHeaderFixedColumns}
          scrollableColumns={state.groupHeaderScrollableColumns}
          onColumnResize={this._onColumnResize}
        />
      );
    }

    const showScrollbarX = maxScrollX > 0 && state.overflowX !== 'hidden';
    const showScrollbarY = maxScrollY > 0 && state.overflowY !== 'hidden';
    const scrollbarXHeight = showScrollbarX ? SCROLL_BAR_SIZE : 0;
    let scrollbarYHeight =
      height - scrollbarXHeight - 2 * BORDER_HEIGHT - footerHeight;

    const headerOffsetTop = state.useGroupHeader ? groupHeaderHeight : 0;
    var bodyOffsetTop = headerOffsetTop + headerHeight;
    scrollbarYHeight -= bodyOffsetTop;
    let bottomSectionOffset = 0;
    let footOffsetTop =
      props.maxHeight != null
        ? bodyOffsetTop + state.bodyHeight
        : bodyOffsetTop + scrollbarYHeight;
    const rowsContainerHeight = footOffsetTop + footerHeight;

    if (props.ownerHeight !== undefined && props.ownerHeight < height) {
      bottomSectionOffset = props.ownerHeight - height;

      footOffsetTop = Math.min(
        footOffsetTop,
        props.ownerHeight - footerHeight - scrollbarXHeight
      );

      scrollbarYHeight = Math.max(0, footOffsetTop - bodyOffsetTop);
    }

    var verticalScrollbar;
    if (showScrollbarY) {
      verticalScrollbar = (
        <Scrollbar
          size={scrollbarYHeight}
          contentSize={scrollbarYHeight + maxScrollY}
          onScroll={this._onVerticalScroll}
          verticalTop={bodyOffsetTop}
          position={scrollY}
        />
      );
    }

    var horizontalScrollbar;
    if (showScrollbarX) {
      horizontalScrollbar = (
        <HorizontalScrollbar
          contentSize={width + maxScrollX}
          offset={bottomSectionOffset}
          onScroll={this._onHorizontalScroll}
          position={scrollX}
          size={width}
        />
      );
    }
    var columnResizingData = state.columnResizingData;
    var dragKnob = (
      <FixedDataTableColumnResizeHandle
        height={height}
        initialWidth={columnResizingData.width || 0}
        minWidth={columnResizingData.minWidth || 0}
        maxWidth={columnResizingData.maxWidth || Number.MAX_VALUE}
        visible={!!state.isColumnResizing}
        leftOffset={columnResizingData.left || 0}
        knobHeight={headerHeight}
        initialEvent={columnResizingData.initialEvent}
        onColumnResizeEnd={props.onColumnResizeEndCallback}
        columnKey={columnResizingData.key}
      />
    );

    var footer = null;
    if (footerHeight) {
      footer = (
        <FixedDataTableRow
          key="footer"
          isScrolling={this._isScrolling}
          className={joinClasses(
            cx('fixedDataTableLayout/footer'),
            cx('public/fixedDataTable/footer')
          )}
          width={width}
          height={footerHeight}
          index={-1}
          zIndex={1}
          offsetTop={footOffsetTop}
          fixedColumns={state.footFixedColumns}
          scrollableColumns={state.footScrollableColumns}
          scrollLeft={scrollX}
        />
      );
    }

    var rows = this._renderRows(bodyOffsetTop);

    var header = (
      <FixedDataTableRow
        key="header"
        isScrolling={this._isScrolling}
        className={joinClasses(
          cx('fixedDataTableLayout/header'),
          cx('public/fixedDataTable/header')
        )}
        width={width}
        height={headerHeight}
        index={-1}
        zIndex={1}
        offsetTop={headerOffsetTop}
        scrollLeft={scrollX}
        fixedColumns={state.headFixedColumns}
        scrollableColumns={state.headScrollableColumns}
        onColumnResize={this._onColumnResize}
      />
    );

    var topShadow;
    var bottomShadow;
    if (scrollY) {
      topShadow = (
        <div
          className={joinClasses(
            cx('fixedDataTableLayout/topShadow'),
            cx('public/fixedDataTable/topShadow')
          )}
          style={{ top: bodyOffsetTop }}
        />
      );
    }

    if (
      (ownerHeight != null &&
        ownerHeight < height &&
        state.scrollContentHeight + state.reservedHeight > ownerHeight) ||
      scrollY < maxScrollY
    ) {
      bottomShadow = (
        <div
          className={joinClasses(
            cx('fixedDataTableLayout/bottomShadow'),
            cx('public/fixedDataTable/bottomShadow')
          )}
          style={{ top: footOffsetTop }}
        />
      );
    }

    return (
      <div
        className={joinClasses(
          cx('fixedDataTableLayout/main'),
          cx('public/fixedDataTable/main')
        )}
        onTouchStart={this._touchHandler.onTouchStart}
        onTouchEnd={this._touchHandler.onTouchEnd}
        onTouchMove={this._touchHandler.onTouchMove}
        onTouchCancel={this._touchHandler.onTouchCancel}
        onWheel={this._wheelHandler.onWheel}
        style={{ height, width }}
      >
        <div
          className={cx('fixedDataTableLayout/rowsContainer')}
          style={{ height: rowsContainerHeight, width }}
        >
          {dragKnob}
          {groupHeader}
          {header}
          {rows}
          {footer}
          {topShadow}
          {bottomShadow}
        </div>
        {verticalScrollbar}
        {horizontalScrollbar}
      </div>
    );
  },
  componentWillUnmount() {
    this._wheelHandler = null;
    this._touchHandler = null;
    // Cancel any pending debounced scroll handling and handle immediately.
    this._didScrollStop.reset();
    this._didScrollStopSync();
  },
  _renderRows(/*number*/ offsetTop) /*object*/ {
    var state = this.state;

    return (
      <FixedDataTableBufferedRows
        isScrolling={this._isScrolling}
        defaultRowHeight={state.rowHeight}
        firstRowIndex={state.firstRowIndex}
        firstRowOffset={state.firstRowOffset}
        fixedColumns={state.bodyFixedColumns}
        height={state.bodyHeight}
        offsetTop={offsetTop}
        onRowClick={state.onRowClick}
        onRowDoubleClick={state.onRowDoubleClick}
        onRowMouseDown={state.onRowMouseDown}
        onRowMouseEnter={state.onRowMouseEnter}
        onRowMouseLeave={state.onRowMouseLeave}
        rowClassNameGetter={state.rowClassNameGetter}
        rowsCount={state.rowsCount}
        rowGetter={state.rowGetter}
        rowHeightGetter={state.rowHeightGetter}
        scrollLeft={state.scrollX}
        scrollableColumns={state.bodyScrollableColumns}
        showLastRowBorder={true}
        width={state.width}
        rowPositionGetter={this._scrollHelper.getRowPosition}
      />
    );
  },

  /**
   * This is called when a cell that is in the header of a column has its
   * resizer knob clicked on. It displays the resizer and puts in the correct
   * location on the table.
   */
  _onColumnResize(
    /*number*/ combinedWidth,
    /*number*/ leftOffset,
    /*number*/ cellWidth,
    /*?number*/ cellMinWidth,
    /*?number*/ cellMaxWidth,
    /*number|string*/ columnKey,
    /*object*/ event
  ) {
    this.setState({
      isColumnResizing: true,
      columnResizingData: {
        left: leftOffset + combinedWidth - cellWidth,
        width: cellWidth,
        minWidth: cellMinWidth,
        maxWidth: cellMaxWidth,
        initialEvent: {
          clientX: event.clientX,
          clientY: event.clientY,
          preventDefault: emptyFunction
        },
        key: columnKey
      }
    });
  },

  _areColumnSettingsIdentical(oldColumns: Array, newColumns: Array): boolean {
    if (oldColumns.length !== newColumns.length) {
      return false;
    }
    for (var index = 0; index < oldColumns.length; ++index) {
      if (!shallowEqual(oldColumns[index].props, newColumns[index].props)) {
        return false;
      }
    }
    return true;
  },

  _populateColumnsAndColumnData(
    columns: Array,
    columnGroups: ?Array,
    oldState: ?Object
  ): Object {
    var canReuseColumnSettings = false;
    var canReuseColumnGroupSettings = false;

    if (oldState && oldState.columns) {
      canReuseColumnSettings = this._areColumnSettingsIdentical(
        columns,
        oldState.columns
      );
    }
    if (oldState && oldState.columnGroups && columnGroups) {
      canReuseColumnGroupSettings = this._areColumnSettingsIdentical(
        columnGroups,
        oldState.columnGroups
      );
    }

    var columnInfo = {};
    if (canReuseColumnSettings) {
      columnInfo.bodyFixedColumns = oldState.bodyFixedColumns;
      columnInfo.bodyScrollableColumns = oldState.bodyScrollableColumns;
      columnInfo.headFixedColumns = oldState.headFixedColumns;
      columnInfo.headScrollableColumns = oldState.headScrollableColumns;
      columnInfo.footFixedColumns = oldState.footFixedColumns;
      columnInfo.footScrollableColumns = oldState.footScrollableColumns;
    } else {
      var bodyColumnTypes = this._splitColumnTypes(columns);
      columnInfo.bodyFixedColumns = bodyColumnTypes.fixed;
      columnInfo.bodyScrollableColumns = bodyColumnTypes.scrollable;

      var headColumnTypes = this._splitColumnTypes(
        this._selectColumnElement(HEADER, columns)
      );
      columnInfo.headFixedColumns = headColumnTypes.fixed;
      columnInfo.headScrollableColumns = headColumnTypes.scrollable;

      var footColumnTypes = this._splitColumnTypes(
        this._selectColumnElement(FOOTER, columns)
      );
      columnInfo.footFixedColumns = footColumnTypes.fixed;
      columnInfo.footScrollableColumns = footColumnTypes.scrollable;
    }

    if (canReuseColumnGroupSettings) {
      columnInfo.groupHeaderFixedColumns = oldState.groupHeaderFixedColumns;
      columnInfo.groupHeaderScrollableColumns =
        oldState.groupHeaderScrollableColumns;
    } else {
      if (columnGroups) {
        var groupHeaderColumnTypes = this._splitColumnTypes(
          this._selectColumnElement(HEADER, columnGroups)
        );
        columnInfo.groupHeaderFixedColumns = groupHeaderColumnTypes.fixed;
        columnInfo.groupHeaderScrollableColumns =
          groupHeaderColumnTypes.scrollable;
      }
    }

    return columnInfo;
  },

  _calculateState(/*object*/ props, /*?object*/ oldState) /*object*/ {
    var {
      width,
      height,
      maxHeight,
      scrollLeft,
      scrollTop,
      rowsCount,
      rowHeight,
      rowHeightGetter,
      headerHeight,
      footerHeight,
      groupHeaderHeight
    } = props;
    invariant(
      height !== undefined || maxHeight !== undefined,
      'You must set either a height or a maxHeight'
    );

    var children = [];
    ReactChildren.forEach(props.children, (child, index) => {
      if (child == null) {
        return;
      }
      invariant(
        child.type.__TableColumnGroup__ || child.type.__TableColumn__,
        'child type should be <FixedDataTableColumn /> or ' +
          '<FixedDataTableColumnGroup />'
      );
      children.push(child);
    });

    var useGroupHeader = false;
    if (children.length && children[0].type.__TableColumnGroup__) {
      useGroupHeader = true;
    }

    var firstRowIndex = (oldState && oldState.firstRowIndex) || 0;
    var firstRowOffset = (oldState && oldState.firstRowOffset) || 0;
    var scrollY = oldState ? oldState.scrollY : 0;
    var scrollX = oldState ? oldState.scrollX : 0;

    var lastScrollLeft = oldState ? oldState.scrollLeft : 0;
    if (scrollLeft !== undefined && scrollLeft !== lastScrollLeft) {
      scrollX = scrollLeft;
    }

    var lastScrollTop = oldState ? oldState.scrollTop : undefined;
    if (scrollTop != null && scrollTop !== lastScrollTop) {
      scrollState = this._scrollHelper.scrollTo(scrollTop);
      firstRowIndex = scrollState.index;
      firstRowOffset = scrollState.offset;
      scrollY = scrollState.position;
    }

    if (this._rowToScrollTo !== undefined) {
      scrollState = this._scrollHelper.scrollRowIntoView(this._rowToScrollTo);
      firstRowIndex = scrollState.index;
      firstRowOffset = scrollState.offset;
      scrollY = scrollState.position;
      delete this._rowToScrollTo;
    }

    var groupHeaderHeight = useGroupHeader ? groupHeaderHeight : 0;

    if (oldState && rowsCount !== oldState.rowsCount) {
      // Number of rows changed, try to scroll to the row from before the
      // change
      var viewportHeight =
        (height === undefined ? maxHeight : height) -
        (headerHeight || 0) -
        (footerHeight || 0) -
        (groupHeaderHeight || 0);
      this._scrollHelper = new FixedDataTableScrollHelper(
        rowsCount,
        rowHeight,
        viewportHeight,
        rowHeightGetter
      );
      var scrollState = this._scrollHelper.scrollToRow(
        firstRowIndex,
        firstRowOffset
      );
      firstRowIndex = scrollState.index;
      firstRowOffset = scrollState.offset;
      scrollY = scrollState.position;
    } else if (oldState && rowHeightGetter !== oldState.rowHeightGetter) {
      this._scrollHelper.setRowHeightGetter(rowHeightGetter);
    }

    var columnResizingData;
    if (props.isColumnResizing) {
      columnResizingData = oldState && oldState.columnResizingData;
    } else {
      columnResizingData = EMPTY_OBJECT;
    }

    var columns;
    var columnGroups;

    if (useGroupHeader) {
      var columnGroupSettings = FixedDataTableWidthHelper.adjustColumnGroupWidths(
        children,
        width
      );
      columns = columnGroupSettings.columns;
      columnGroups = columnGroupSettings.columnGroups;
    } else {
      columns = FixedDataTableWidthHelper.adjustColumnWidths(children, width);
    }

    var columnInfo = this._populateColumnsAndColumnData(
      columns,
      columnGroups,
      oldState
    );

    if (this._columnToScrollTo !== undefined) {
      // If selected column is a fixed column, don't scroll
      var bodyFixedColumns = columnInfo.bodyFixedColumns;
      var fixedColumnsCount = bodyFixedColumns.length;
      var bodyScrollableColumns = columnInfo.bodyScrollableColumns;
      if (this._columnToScrollTo >= fixedColumnsCount) {
        var totalFixedColumnsWidth = 0;
        var i, column;
        for (i = 0; i < fixedColumnsCount; ++i) {
          column = bodyFixedColumns[i];
          totalFixedColumnsWidth += column.props.width;
        }

        var scrollableColumnIndex = Math.min(
          this._columnToScrollTo - fixedColumnsCount,
          bodyScrollableColumns.length - 1
        );

        var previousColumnsWidth = 0;
        for (i = 0; i < scrollableColumnIndex; ++i) {
          column = bodyScrollableColumns[i];
          previousColumnsWidth += column.props.width;
        }

        var availableScrollWidth = width - totalFixedColumnsWidth;
        var selectedColumnWidth =
          bodyScrollableColumns[scrollableColumnIndex].props.width;
        var minAcceptableScrollPosition =
          previousColumnsWidth + selectedColumnWidth - availableScrollWidth;

        if (scrollX < minAcceptableScrollPosition) {
          scrollX = minAcceptableScrollPosition;
        }

        if (scrollX > previousColumnsWidth) {
          scrollX = previousColumnsWidth;
        }
      }
      delete this._columnToScrollTo;
    }

    var useMaxHeight = height === undefined;
    var height = Math.round(useMaxHeight ? maxHeight : height);
    var totalHeightReserved =
      footerHeight + headerHeight + groupHeaderHeight + 2 * BORDER_HEIGHT;
    var bodyHeight = height - totalHeightReserved;
    var scrollContentHeight = this._scrollHelper.getContentHeight();
    var totalHeightNeeded = scrollContentHeight + totalHeightReserved;
    var scrollContentWidth = FixedDataTableWidthHelper.getTotalWidth(columns);

    var horizontalScrollbarVisible =
      scrollContentWidth > width && props.overflowX !== 'hidden';

    if (horizontalScrollbarVisible) {
      bodyHeight -= SCROLL_BAR_SIZE;
      totalHeightNeeded += SCROLL_BAR_SIZE;
      totalHeightReserved += SCROLL_BAR_SIZE;
    }

    var maxScrollX = Math.max(0, scrollContentWidth - width);
    var maxScrollY = Math.max(0, scrollContentHeight - bodyHeight);
    scrollX = Math.min(scrollX, maxScrollX);
    scrollY = Math.min(scrollY, maxScrollY);

    if (!maxScrollY) {
      // no vertical scrollbar necessary, use the totals we tracked so we
      // can shrink-to-fit vertically
      if (useMaxHeight) {
        height = totalHeightNeeded;
      }
      bodyHeight = totalHeightNeeded - totalHeightReserved;
    }

    this._scrollHelper.setViewportHeight(bodyHeight);

    // The order of elements in this object metters and bringing bodyHeight,
    // height or useGroupHeader to the top can break various features
    var newState = {
      isColumnResizing: oldState && oldState.isColumnResizing,
      // isColumnResizing should be overwritten by value from props if
      // avaialble

      ...columnInfo,
      ...props,

      columns,
      columnGroups,
      columnResizingData,
      firstRowIndex,
      firstRowOffset,
      horizontalScrollbarVisible,
      maxScrollX,
      maxScrollY,
      reservedHeight: totalHeightReserved,
      scrollContentHeight,
      scrollX,
      scrollY,

      // These properties may overwrite properties defined in
      // columnInfo and props
      bodyHeight,
      height,
      groupHeaderHeight,
      useGroupHeader
    };

    return newState;
  },

  _selectColumnElement(/*string*/ type, /*array*/ columns) /*array*/ {
    var newColumns = [];
    for (var i = 0; i < columns.length; ++i) {
      var column = columns[i];
      var columnProps = column.props;
      newColumns.push(
        React.cloneElement(column, {
          cell: type ? columnProps[type] : columnProps[CELL]
        })
      );
    }
    return newColumns;
  },

  _splitColumnTypes(/*array*/ columns) /*object*/ {
    var fixedColumns = [];
    var scrollableColumns = [];
    var column;
    for (var i = 0; i < columns.length; ++i) {
      var column = columns[i];
      if (column.props.fixed) {
        fixedColumns.push(column);
      } else {
        scrollableColumns.push(column);
      }
    }
    return {
      fixed: fixedColumns,
      scrollable: scrollableColumns
    };
  },

  _onWheel(/*number*/ deltaX, /*number*/ deltaY) {
    if (!this._isScrolling) {
      this._didScrollStart();
    }
    const state = this.state;
    const props = this.props;
    if (Math.abs(deltaY) > Math.abs(deltaX) && props.overflowY !== 'hidden') {
      const scrollState = this._scrollHelper.scrollBy(Math.round(deltaY));
      const onVerticalScroll = props.onVerticalScroll;
      const firstRowOffset = scrollState.offset;
      const scrollY = scrollState.position;
      if (onVerticalScroll ? onVerticalScroll(scrollY, firstRowOffset) : true) {
        const scrollContentHeight = scrollState.contentHeight;
        const firstRowIndex = scrollState.index;
        const maxScrollY = Math.max(0, scrollContentHeight - state.bodyHeight);
        this.setState({
          firstRowIndex,
          firstRowOffset,
          scrollY,
          maxScrollY,
          scrollContentHeight
        });
      }
    } else if (deltaX && props.overflowX !== 'hidden') {
      let { scrollX: x, maxScrollX } = state;
      x += deltaX;
      x = x < 0 ? 0 : x;
      x = x > maxScrollX ? maxScrollX : x;
      const onHorizontalScroll = props.onHorizontalScroll;
      if (onHorizontalScroll ? onHorizontalScroll(x) : true) {
        this.setState({
          scrollX: x
        });
      }
    }

    this._didScrollStop();
  },

  _onHorizontalScroll(/*number*/ scrollPos) {
    const state = this.state;
    if (scrollPos !== state.scrollX) {
      if (!this._isScrolling) {
        this._didScrollStart();
      }
      const onHorizontalScroll = this.props.onHorizontalScroll;
      const scrollX = Math.round(scrollPos);
      if (onHorizontalScroll ? onHorizontalScroll(scrollX) : true) {
        this.setState({
          scrollX
        });
        this._didScrollStop();
      }
    }
  },

  _onVerticalScroll(/*number*/ scrollPos) {
    const state = this.state;
    if (scrollPos !== state.scrollY) {
      if (!this._isScrolling) {
        this._didScrollStart();
      }
      const scrollState = this._scrollHelper.scrollTo(Math.round(scrollPos));
      const onVerticalScroll = this.props.onVerticalScroll;
      const firstRowOffset = scrollState.offset;
      const scrollY = scrollState.position;
      if (onVerticalScroll ? onVerticalScroll(scrollY, firstRowOffset) : true) {
        const scrollContentHeight = scrollState.contentHeight;
        const maxScrollY = Math.max(0, scrollContentHeight - state.bodyHeight);
        const firstRowIndex = scrollState.index;
        this.setState({
          firstRowIndex,
          firstRowOffset,
          scrollY,
          scrollContentHeight,
          maxScrollY
        });
        this._didScrollStop();
      }
    }
  },

  _didScrollStart() {
    if (!this._isScrolling) {
      this._isScrolling = true;
      if (this.props.onScrollStart) {
        this.props.onScrollStart(this.state.scrollX, this.state.scrollY);
      }
    }
  },

  // We need two versions of this function, one to finish up synchronously (for
  // example, in componentWillUnmount), and a debounced version for normal
  // scroll handling.
  _didScrollStopSync() {
    if (this._isScrolling) {
      this._isScrolling = false;
      this.setState({ redraw: true });
      if (this.props.onScrollEnd) {
        this.props.onScrollEnd(this.state.scrollX, this.state.scrollY);
      }
    }
  }
});

var HorizontalScrollbar = createReactClass({
  mixins: [ReactComponentWithPureRenderMixin],
  propTypes: {
    contentSize: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    onScroll: PropTypes.func.isRequired,
    position: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired
  },

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
});

module.exports = FixedDataTable;

import { Item, Margin, Subscription } from "@/interfaces";
import { DashItem } from "./DashItem.model";

export class Layout {
  private _breakpoint: string;
  private _breakpointWidth: number | undefined;
  private _margin: Margin;
  private _width: number;
  private _height: number;
  private _numberOfCols: number;
  private _autoHeight: boolean;
  private _keepSquare: boolean;
  private _rowHeight: number;
  private _compact: boolean;
  private _useCssTransforms: boolean;
  private _itemBeingDragged: boolean = false;
  private _itemBeingResized: boolean = false;
  private _dashItems: DashItem[] = [];
  private _dragStartListeners: Subscription[] = [];
  private _dragListeners: Subscription[] = [];
  private _dragEndListeners: Subscription[] = [];
  private _resizeStartListeners: Subscription[] = [];
  private _resizeListeners: Subscription[] = [];
  private _resizeEndListeners: Subscription[] = [];

  constructor({
    breakpoint,
    numberOfCols,
    breakpointWidth,
    margin,
    autoHeight,
    keepSquare,
    useCssTransforms,
    width,
    height,
    rowHeight,
    compact
  }: {
    breakpoint: string;
    numberOfCols: number;
    breakpointWidth?: number;
    margin?: Margin;
    autoHeight?: boolean;
    keepSquare?: boolean;
    useCssTransforms?: boolean;
    width?: number;
    height?: number;
    rowHeight?: number;
    compact?: boolean;
  }) {
    this._breakpoint = breakpoint;
    this._numberOfCols = numberOfCols;

    if (typeof breakpointWidth !== "undefined") {
      this._breakpointWidth = breakpointWidth;
    } else {
      this._breakpointWidth = Layout.defaults.breakpointWidth;
    }

    if (typeof margin !== "undefined") {
      this._margin = margin;
    } else {
      this._margin = Layout.defaults.margin;
    }

    if (typeof autoHeight !== "undefined") {
      this._autoHeight = autoHeight;
    } else {
      this._autoHeight = Layout.defaults.autoHeight;
    }
    if (typeof keepSquare !== "undefined") {
      this._keepSquare = keepSquare;
    } else {
      this._keepSquare = Layout.defaults.keepSquare;
    }

    if (typeof useCssTransforms !== "undefined") {
      this._useCssTransforms = useCssTransforms;
    } else {
      this._useCssTransforms = Layout.defaults.useCssTransforms;
    }

    if (typeof width !== "undefined") {
      this._width = width;
    } else {
      this._width = Layout.defaults.width;
    }

    if (typeof height !== "undefined") {
      this._height = height;
    } else {
      this._height = Layout.defaults.height;
    }
    if (typeof rowHeight !== "undefined") {
      this._rowHeight = rowHeight;
    } else {
      this._rowHeight = Layout.defaults.rowHeight;
    }
    if (typeof compact !== "undefined") {
      this._compact = compact;
    } else {
      this._compact = Layout.defaults.compact;
    }
  }
  get breakpoint() {
    return this._breakpoint;
  }
  set breakpoint(b: string) {
    this._breakpoint = b;
  }
  get breakpointWidth() {
    return this._breakpointWidth;
  }
  set breakpointWidth(bw: number | undefined) {
    this._breakpointWidth = bw;
  }
  get margin() {
    return this._margin;
  }
  set margin(m: Margin) {
    this._margin = m;
  }
  get width() {
    return this._width;
  }
  set width(w: number) {
    this._width = w;
    this.updateDashItems();
  }
  get height() {
    if (this.autoHeight) {
      return this.calculateHeight();
    }
    return this._height;
  }
  set height(h: number) {
    this._height = h;
  }
  get numberOfCols() {
    return this._numberOfCols;
  }
  set numberOfCols(n: number) {
    this._numberOfCols = n;
    this.updateDashItems();
  }
  get autoHeight() {
    return this._autoHeight;
  }
  set autoHeight(ah: boolean) {
    this._autoHeight = ah;
  }
  get keepSquare() {
    return this._keepSquare;
  }
  set keepSquare(k: boolean) {
    this._keepSquare = k;
  }
  get rowHeight() {
    if (this.keepSquare) {
      return this.colWidth;
    }
    return this._rowHeight;
  }
  set rowHeight(rh: number) {
    this._rowHeight = rh;
  }
  get colWidth() {
    return (
      (this.width - this.margin.x * (this.numberOfCols + 1)) / this.numberOfCols
    );
  }
  //Item Methods
  get itemBeingDragged() {
    return this._itemBeingDragged;
  }
  set itemBeingDragged(ibd: boolean) {
    this._itemBeingDragged = ibd;
  }
  get itemBeingResized() {
    return this._itemBeingResized;
  }
  set itemBeingResized(ibr: boolean) {
    this._itemBeingResized = ibr;
  }
  get placeholder() {
    return this.getDashItemById("-1Placeholder");
  }
  set placeholder(p) {
    this.placeholder = p;
  }
  get compact() {
    return this._compact;
  }
  set compact(c: boolean) {
    this._compact = c;
  }
  //Reactive Methods
  calculateHeight() {
    let maxY = 0;
    let bottomY = 0;
    for (let item of this._dashItems) {
      bottomY = item.y + item.height;
      if (bottomY > maxY) {
        maxY = bottomY;
      }
    }
    return maxY * (this.rowHeight + this.margin.y) + this.margin.y;
  }
  //DashItem Methods
  addDashItem(d: DashItem) {
    this._dashItems.push(d);
    this.updateDashItems();
    //Drag Subscriptions
    let unDragStart = d.onDragStart.subscribe(item => {
      this.itemDragging(item);
    });
    this._dragStartListeners.push({
      id: d.id,
      unsubscribe: unDragStart
    });
    let unDrag = d.onDrag.subscribe(item => {
      this.itemDragging(item);
    });
    this._dragListeners.push({
      id: d.id,
      unsubscribe: unDrag
    });
    let unDragEnd = d.onDragEnd.subscribe(item => {
      this.itemDraggingComplete(item);
    });
    this._dragEndListeners.push({ id: d.id, unsubscribe: unDragEnd });
    //Resize Subscirptions
    let unResizeStart = d.onResizeStart.subscribe(item => {
      this.itemResizing(item);
    });
    this._resizeStartListeners.push({
      id: d.id,
      unsubscribe: unResizeStart
    });
    let unResize = d.onResize.subscribe(item => {
      this.itemResizing(item);
    });
    this._resizeListeners.push({
      id: d.id,
      unsubscribe: unResize
    });
    let unResizeEnd = d.onResizeEnd.subscribe(item => {
      this.itemResizingComplete(item);
    });
    this._resizeEndListeners.push({
      id: d.id,
      unsubscribe: unResizeEnd
    });

    //Check that the added item has not caused a collision and if so move the others.
    let items = this.compactLayout(this.items);
    this.syncItems(items);
  }
  removeDashItem(d: DashItem) {
    let index = this._dashItems.findIndex(item => {
      return item.id === d.id;
    });
    if (index >= 0) {
      this._dashItems.splice(index, 1);
    }
    //Remove Event Listerners
    index = this._dragStartListeners.findIndex(item => {
      return item.id === d.id;
    });
    if (index >= 0) {
      this._dragStartListeners[index].unsubscribe();
      this._dragStartListeners.splice(index, 1);
    }
    index = this._dragListeners.findIndex(item => {
      return item.id === d.id;
    });
    if (index >= 0) {
      this._dragListeners[index].unsubscribe();
      this._dragListeners.splice(index, 1);
    }
    index = this._dragEndListeners.findIndex(item => {
      return item.id === d.id;
    });
    if (index >= 0) {
      this._dragEndListeners[index].unsubscribe();
      this._dragEndListeners.splice(index, 1);
    }
    //Remove Drag Listerners
    index = this._resizeStartListeners.findIndex(item => {
      return item.id === d.id;
    });
    if (index >= 0) {
      this._resizeStartListeners[index].unsubscribe();
      this._resizeStartListeners.splice(index, 1);
    }
    index = this._resizeListeners.findIndex(item => {
      return item.id === d.id;
    });
    if (index >= 0) {
      this._resizeListeners[index].unsubscribe();
      this._resizeListeners.splice(index, 1);
    }
    index = this._resizeEndListeners.findIndex(item => {
      return item.id === d.id;
    });
    if (index >= 0) {
      this._resizeEndListeners[index].unsubscribe();
      this._resizeEndListeners.splice(index, 1);
    }
  }
  getDashItemById(id: string | number) {
    let index = this._dashItems.findIndex(item => {
      return item.id === id;
    });
    if (index >= 0) {
      return this._dashItems[index];
    }
    return null;
  }
  updateDashItems() {
    this._dashItems.forEach(item => {
      item.colWidth = this.colWidth;
      item.rowHeight = this.rowHeight;
      item.margin = this.margin;
    });
  }
  //Item Methods
  get items() {
    let items: Item[] = [];
    this._dashItems.forEach(dashItem => {
      items.push(dashItem.toItem());
    });
    return items;
  }
  itemDragging(item: Item) {
    if (!this.itemBeingDragged) {
      this.placeholder!.x = item.x;
      this.placeholder!.y = item.y;
      this.placeholder!.width = item.width;
      this.placeholder!.height = item.height;
      this.itemBeingDragged = true;
    }
    //Take a copy of items
    let itemsCopy = JSON.parse(JSON.stringify(this.items)) as Item[];
    //Remove the item being dragged as the placeholder takes its place. Otherwise the item will snap while being dragged.
    let items = itemsCopy.filter(i => {
      return i.id !== item.id;
    });
    let placeholderIndex = items.findIndex(i => {
      return i.id === this.placeholder!.id;
    });
    //items = this.correctBounds(items);
    items = this.moveItem(
      items,
      items[placeholderIndex],
      DashItem.getXFromLeft(item.left!, this.colWidth, this.margin),
      DashItem.getYFromTop(item.top!, this.rowHeight, this.margin),
      true
    );
    items = this.compactLayout(items);
    this.syncItems(items);
  }
  itemDraggingComplete(item: Item) {
    this.itemBeingDragged = false;
    let dashItem = this.getDashItemById(item.id);
    if (dashItem) {
      dashItem.x = this.placeholder!.x;
      dashItem.y = this.placeholder!.y;
    }
    this.placeholder!.x = 0;
    this.placeholder!.y = 0;
    this.placeholder!.width = 0;
    this.placeholder!.height = 0;
  }
  itemResizing(item: Item) {
    this.itemBeingResized = true;
    this.placeholder!.x = DashItem.getXFromLeft(
      item.left!,
      this.colWidth,
      this.margin
    );
    this.placeholder!.y = DashItem.getYFromTop(
      item.top!,
      this.rowHeight,
      this.margin
    );
    this.placeholder!.width = DashItem.getWidthFromPx(
      item.widthPx!,
      this.colWidth,
      this.margin
    );
    this.placeholder!.height = DashItem.getHeightFromPx(
      item.heightPx!,
      this.rowHeight,
      this.margin
    );
    //Take a copy of items
    let itemsCopy = JSON.parse(JSON.stringify(this.items)) as Item[];
    //Remove the item being resized as the placeholder takes its place. Otherwise the item will snap while being resized.
    let items = itemsCopy.filter(i => {
      return i.id !== item.id;
    });
    let placeholderIndex = items.findIndex(i => {
      return i.id === this.placeholder!.id;
    });
    items = this.moveItem(
      items,
      items[placeholderIndex],
      DashItem.getXFromLeft(item.left!, this.colWidth, this.margin),
      DashItem.getYFromTop(item.top!, this.rowHeight, this.margin),
      true
    );
    items = this.compactLayout(items);
    this.syncItems(items);
  }
  itemResizingComplete(item: Item) {
    this.itemBeingResized = false;
    let dashItem = this.getDashItemById(item.id);
    if (dashItem) {
      dashItem.x = this.placeholder!.x;
      dashItem.y = this.placeholder!.y;
      dashItem.width = this.placeholder!.width;
      dashItem.height = this.placeholder!.height;
    }
    this.placeholder!.x = 0;
    this.placeholder!.y = 0;
    this.placeholder!.width = 0;
    this.placeholder!.height = 0;
  }
  //Collision Utils
  checkForCollision(d1: Item, d2: Item) {
    if (d1.id === d2.id) {
      return false;
    }
    if (d1.x + d1.width <= d2.x) {
      return false;
    }
    if (d1.x >= d2.x + d2.width) {
      return false;
    }
    if (d1.y + d1.height <= d2.y) {
      return false;
    }
    if (d1.y >= d2.y + d2.height) {
      return false;
    }
    return true;
  }
  getFirstCollision(items: Item[], d: Item) {
    for (let i of items) {
      if (this.checkForCollision(d, i)) {
        return i;
      }
    }
    return null;
  }
  getAllCollisions(items: Item[], d: Item) {
    return items.filter(item => this.checkForCollision(item, d));
  }
  //Layout and Item Moving Methods
  correctItemBounds(item: Item) {
    if (item.x + item.width > this.numberOfCols) {
      item.x = this.numberOfCols - item.width;
    }
    if (item.x < 0) {
      item.x = 0;
    }
    if (item.y < 0) {
      item.y = 0;
    }
    if (item.width > this.numberOfCols) {
      item.x = 0;
      item.width = this.numberOfCols;
    }
    return item;
  }
  correctBounds(items: Item[]) {
    for (let i = 0; i < items.length; i++) {
      items[i] = this.correctItemBounds(items[i]);
    }
    return items;
  }
  compactLayout(items: Item[]) {
    const sorted = this.sortItems(items);
    const compareWith = [] as Item[];
    const out = Array(items.length) as Item[];

    for (let i = 0; i < sorted.length; i++) {
      let l = sorted[i];
      l = this.compactItem(compareWith, l);
      // Add to comparison array. We only collide with items before this one.
      compareWith.push(l);
      // Add to output array to make sure they still come out in the right order.
      let index = items.findIndex(item => {
        return item.id === l.id;
      });
      out[index] = l;
      // Clear moved flag, if it exists.
      l.moved = false;
    }
    return out;
  }
  compactItem(items: Item[], d: Item) {
    if (this.compact) {
      while (d.y > 0 && !this.getFirstCollision(items, d)) {
        d.y--;
      }
    }
    let collides;
    while ((collides = this.getFirstCollision(items, d))) {
      d.y = collides.y + collides.height;
    }
    return d;
  }
  sortItems(items: Item[], reverse?: Boolean) {
    let i = JSON.parse(JSON.stringify(items)) as Item[];
    i.sort((a, b) => {
      if (a.y > b.y || (a.y === b.y && a.x > b.x)) {
        return 1;
      }
      return -1;
    });
    if (reverse) {
      i.reverse();
    }
    return i;
  }
  moveItem(
    items: Item[],
    d: Item,
    x: number,
    y: number,
    isUserAction?: boolean
  ) {
    const movingUp: boolean = d.y > y;
    d.x = x;
    d.y = y;
    d.moved = true;
    d = this.correctItemBounds(d);
    const sorted = this.sortItems(items, movingUp);
    const collisions = this.getAllCollisions(sorted, d);
    for (let collision of collisions) {
      if (collision.moved) {
        continue;
      }
      // This makes it feel a bit more precise by waiting to swap for just a bit when moving up.
      if (d.y > collision.y && d.y - collision.y > collision.height / 4) {
        continue;
      }
      let collisionIndex = items.findIndex(item => {
        return item.id === collision.id;
      });
      items = this.moveItemFromCollision(
        items,
        d,
        items[collisionIndex],
        isUserAction
      );
    }
    return items;
  }
  moveItemFromCollision(
    items: Item[],
    colllidesWith: Item,
    itemToMove: Item,
    isUserAction?: Boolean
  ) {
    if (isUserAction) {
      const fakeItem: Item = {
        id: "-1fakeItem",
        x: itemToMove.x,
        y: itemToMove.y,
        width: itemToMove.width,
        height: itemToMove.height
      };
      fakeItem.y = Math.max(colllidesWith.y - itemToMove.height, 0);
      if (!this.getFirstCollision(items, fakeItem)) {
        return this.moveItem(items, itemToMove, itemToMove.x, fakeItem.y);
      }
    }
    return this.moveItem(items, itemToMove, itemToMove.x, itemToMove.y + 1);
  }
  syncItems(items: Item[]) {
    items.forEach(i => {
      let dashItem = this.getDashItemById(i.id);
      dashItem!.fromItem(i);
    });
  }
  static get defaults() {
    return {
      numberOfCols: 12 as number,
      breakpointWidth: undefined as number | undefined,
      margin: { x: 10, y: 10 } as Margin,
      autoHeight: true as boolean,
      keepSquare: true as boolean,
      useCssTransforms: false as boolean,
      width: 400 as number,
      height: 400 as number,
      rowHeight: 200 as number,
      compact: true as boolean
    };
  }
}

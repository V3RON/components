/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {FactoryProvider, Injectable, Optional, SkipSelf, OnDestroy} from '@angular/core';
import {Observable, Subject} from 'rxjs';

/** A class representing a range of dates. */
export class DateRange<D> {
  /**
   * Ensures that objects with a `start` and `end` property can't be assigned to a variable that
   * expects a `DateRange`
   */
  // tslint:disable-next-line:no-unused-variable
  private _disableStructuralEquivalency: never;

  constructor(
    /** The start date of the range. */
    readonly start: D | null,
    /** The end date of the range. */
    readonly end: D | null) {}
}

/**
 * Conditionally picks the date type, if a DateRange is passed in.
 * @docs-private
 */
export type ExtractDateTypeFromSelection<T> = T extends DateRange<infer D> ? D : NonNullable<T>;

/** Event emitted by the date selection model when its selection changes. */
export interface DateSelectionModelChange<S> {
  /** New value for the selection. */
  selection: S;

  /** Object that triggered the change. */
  source: unknown;
}

/** A selection model containing a date selection. */
export abstract class MatDateSelectionModel<S, D = ExtractDateTypeFromSelection<S>>
    implements OnDestroy {
  private _selectionChanged = new Subject<DateSelectionModelChange<S>>();

  /** Emits when the selection has changed. */
  selectionChanged: Observable<DateSelectionModelChange<S>> = this._selectionChanged.asObservable();

  protected constructor(
    /** The current selection. */
    readonly selection: S) {
    this.selection = selection;
  }

  /**
   * Updates the current selection in the model.
   * @param value New selection that should be assigned.
   * @param source Object that triggered the selection change.
   */
  updateSelection(value: S, source: unknown) {
    (this as {selection: S}).selection = value;
    this._selectionChanged.next({selection: value, source});
  }

  ngOnDestroy() {
    this._selectionChanged.complete();
  }

  /** Adds a date to the current selection. */
  abstract add(date: D | null): void;

  /** Checks whether the current selection is complete. */
  abstract isComplete(): boolean;
}

/**  A selection model that contains a single date. */
@Injectable()
export class MatSingleDateSelectionModel<D> extends MatDateSelectionModel<D | null, D> {
  constructor() {
    super(null);
  }

  /**
   * Adds a date to the current selection. In the case of a single date selection, the added date
   * simply overwrites the previous selection
   */
  add(date: D | null) {
    super.updateSelection(date, this);
  }

  /**
   * Checks whether the current selection is complete. In the case of a single date selection, this
   * is true if the current selection is not null.
   */
  isComplete() {
    return this.selection != null;
  }
}

/**  A selection model that contains a date range. */
@Injectable()
export class MatRangeDateSelectionModel<D> extends MatDateSelectionModel<DateRange<D>, D> {
  constructor() {
    super(new DateRange<D>(null, null));
  }

  /**
   * Adds a date to the current selection. In the case of a date range selection, the added date
   * fills in the next `null` value in the range. If both the start and the end already have a date,
   * the selection is reset so that the given date is the new `start` and the `end` is null.
   */
  add(date: D | null): void {
    let {start, end} = this.selection;

    if (start == null) {
      start = date;
    } else if (end == null) {
      end = date;
    } else {
      start = date;
      end = null;
    }

    super.updateSelection(new DateRange<D>(start, end), this);
  }

  /**
   * Checks whether the current selection is complete. In the case of a date range selection, this
   * is true if the current selection has a non-null `start` and `end`.
   */
  isComplete(): boolean {
    return this.selection.start != null && this.selection.end != null;
  }
}

/** @docs-private */
export function MAT_SINGLE_DATE_SELECTION_MODEL_FACTORY(
    parent: MatSingleDateSelectionModel<unknown>) {
  return parent || new MatSingleDateSelectionModel();
}

/** Used to provide a single selection model to a component. */
export const MAT_SINGLE_DATE_SELECTION_MODEL_PROVIDER: FactoryProvider = {
  provide: MatDateSelectionModel,
  deps: [[new Optional(), new SkipSelf(), MatDateSelectionModel]],
  useFactory: MAT_SINGLE_DATE_SELECTION_MODEL_FACTORY,
};


/** @docs-private */
export function MAT_RANGE_DATE_SELECTION_MODEL_FACTORY(
    parent: MatSingleDateSelectionModel<unknown>) {
  return parent || new MatRangeDateSelectionModel();
}

/** Used to provide a range selection model to a component. */
export const MAT_RANGE_DATE_SELECTION_MODEL_PROVIDER: FactoryProvider = {
  provide: MatDateSelectionModel,
  deps: [[new Optional(), new SkipSelf(), MatDateSelectionModel]],
  useFactory: MAT_RANGE_DATE_SELECTION_MODEL_FACTORY,
};

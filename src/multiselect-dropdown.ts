/*
 * Angular 2 Dropdown Multiselect for Bootstrap
 * Current version: 0.3.2
 *
 * Simon Lindh
 * https://github.com/softsimon/angular-2-dropdown-multiselect
 */

import {
  NgModule,
  Component,
  Pipe,
  OnInit,
  DoCheck,
  HostListener,
  Input,
  ElementRef,
  Output,
  EventEmitter,
  forwardRef,
  IterableDiffers
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';

const MULTISELECT_VALUE_ACCESSOR: any = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MultiselectDropdown),
  multi: true
};

export interface group {
  name: string;
  related: string[];
}

export interface IMultiSelectOption {
  id: number;
  name: string;
  group?: string;
  first?: boolean;
}

export interface IMultiSelectSettings {
  layout?: 'horizontal' | 'vertical',
  pullRight?: boolean;
  enableSearch?: boolean;
  checkedStyle?: 'checkboxes' | 'glyphicon';
  buttonClasses?: string;
  selectionLimit?: number;
  closeOnSelect?: boolean;
  autoUnselect?: boolean;
  showCheckAll?: boolean;
  showUncheckAll?: boolean;
  dynamicTitleMaxItems?: number;
  maxHeight?: string;
}

export interface IMultiSelectTexts {
  checkAll?: string;
  uncheckAll?: string;
  reset?: string;
  checked?: string;
  checkedPlural?: string;
  searchPlaceholder?: string;
  defaultTitle?: string;
}

@Pipe({
  name: 'searchFilter'
})
export class MultiSelectSearchFilter {
  transform(options: Array<IMultiSelectOption>, args: string): Array<IMultiSelectOption> {
    return options.filter((option: IMultiSelectOption) => {
      if(option.group) {
        return option.name.toLowerCase().indexOf((args || '').toLowerCase()) > -1 || option.group.toLowerCase().indexOf((args || '').toLowerCase()) > -1
      } else {
        return option.name.toLowerCase().indexOf((args || '').toLowerCase()) > -1
      }
    });
  }
}

@Component({
  selector: 'ss-multiselect-dropdown',
  providers: [MULTISELECT_VALUE_ACCESSOR],
  styles: [`
		a { outline: none !important; }
		.horizontal { width: 100%; }
		.horizontal .option { width: 25%; display: inline-block; margin-left: -3px;}
		
	`],
  template: `
        <div class="btn-group" [ngClass]="{'horizontal': settings.layout === 'horizontal'}">
            <button type="button" class="dropdown-toggle" [ngClass]="settings.buttonClasses" 
            (click)="toggleDropdown()">{{ title }}&nbsp;<span class="caret"></span></button>
            <ul *ngIf="isVisible" class="dropdown-menu" [class.pull-right]="settings.pullRight" 
            [style.max-height]="settings.maxHeight" style="display: block; height: auto; overflow-y: auto;">
                <li style="margin: 0px 5px 5px 5px;" *ngIf="settings.enableSearch">
                    <div class="input-group input-group-sm">
                        <span class="input-group-addon" id="sizing-addon3"><i class="fa fa-search"></i></span>
                        <input type="text" class="form-control" placeholder="{{ texts.searchPlaceholder }}" 
                        aria-describedby="sizing-addon3" [(ngModel)]="searchFilterText">
                        <span class="input-group-btn" *ngIf="searchFilterText.length > 0">
                            <button class="btn btn-default" type="button" (click)="clearSearch()"><i class="fa fa-times"></i></button>
                        </span>
                    </div>
                </li>
                <li class="divider" *ngIf="settings.enableSearch"></li>
                <li>
                    <a href="javascript:;" role="menuitem" tabindex="-1" (click)="reset()">
                        <span style="width: 16px;" class="glyphicon glyphicon-refresh"></span>
                        {{ texts.reset }}
                    </a>
                </li>
                <li *ngIf="settings.showCheckAll">
                    <a href="javascript:;" role="menuitem" tabindex="-1" (click)="checkAll()">
                        <span style="width: 16px;" class="glyphicon glyphicon-ok"></span>
                        {{ texts.checkAll }}
                    </a>
                </li>
                <li *ngIf="settings.showUncheckAll">
                    <a href="javascript:;" role="menuitem" tabindex="-1" (click)="uncheckAll()">
                        <span style="width: 16px;" class="glyphicon glyphicon-remove"></span>
                        {{ texts.uncheckAll }}
                    </a>
                </li>
                <li *ngIf="settings.showCheckAll || settings.showUncheckAll" class="divider"></li>
                <template ngFor let-option [ngForOf]="options | searchFilter:searchFilterText">
                    <li *ngIf="option.first && option.group">
                      <a class="group-name" href="javascript:;" role="menuitem" tabindex="-1" (click)="checkGroup(option.group)">
                        <strong>{{option.group}}</strong>
                      </a>
                    </li>
                    <li class="option" [ngClass]="{'option_first': option.first}">
                        <a href="javascript:;" role="menuitem" tabindex="-1" (click)="setSelected($event, option)">
                            <input *ngIf="settings.checkedStyle == 'checkboxes'" type="checkbox" [checked]="isSelected(option)" />
                            <span *ngIf="settings.checkedStyle == 'glyphicon'" style="width: 16px;" 
                            class="glyphicon" [class.glyphicon-ok]="isSelected(option)"></span>
                            {{ option.name }}
                        </a>
                    </li>
                </template>
            </ul>
        </div>
    `
})
export class MultiselectDropdown implements OnInit, DoCheck, ControlValueAccessor {

  @Input() options: Array<IMultiSelectOption>;
  @Input() settings: IMultiSelectSettings;
  @Input() texts: IMultiSelectTexts;
  @Output() selectionLimitReached = new EventEmitter();
  @Output() dropdownClosed = new EventEmitter();
  @Output() dropdownOpened = new EventEmitter();

  @HostListener('document: click', ['$event.target'])
  onClick(target: HTMLElement) {
    let parentFound = false;
    while (target != null && !parentFound) {
      if (target === this.element.nativeElement) {
        parentFound = true;
      }
      target = target.parentElement;
    }
    if (!parentFound) {
      this.isVisible = false;
      this.dropdownClosed.emit();
    }
  }

  onModelChange: Function = (_: any) => {
  };
  onModelTouched: Function = () => {
  };
  model: number[];
  title: string;
  differ: any;
  preSelected: number[];
  numSelected: number = 0;
  isVisible: boolean = false;
  searchFilterText: string = '';
  defaultSettings: IMultiSelectSettings = {
    layout: 'vertical',
    pullRight: false,
    enableSearch: false,
    checkedStyle: 'checkboxes',
    buttonClasses: 'btn btn-default',
    selectionLimit: 0,
    closeOnSelect: false,
    autoUnselect: false,
    showCheckAll: false,
    showUncheckAll: false,
    dynamicTitleMaxItems: 3,
    maxHeight: '300px',
  };
  defaultTexts: IMultiSelectTexts = {
    checkAll: 'Check all',
    reset: 'Reset',
    uncheckAll: 'Uncheck all',
    checked: 'checked',
    checkedPlural: 'checked',
    searchPlaceholder: 'Search...',
    defaultTitle: 'Select',
  };

  constructor(private element: ElementRef,
              private differs: IterableDiffers) {
    this.differ = differs.find([]).create(null);
  }

  ngOnInit() {
    this.settings = Object.assign(this.defaultSettings, this.settings);
    this.texts = Object.assign(this.defaultTexts, this.texts);
    this.title = this.texts.defaultTitle;
  }

  writeValue(value: any): void {
    if (value !== undefined) {
      this.model = value;
      if(this.model) {
        this.preSelected = value.map(i => i);
      }
    }
  }

  registerOnChange(fn: Function): void {
    this.onModelChange = fn;
  }


  registerOnTouched(fn: Function): void {
    this.onModelTouched = fn;
  }

  ngDoCheck() {
    let changes = this.differ.diff(this.model);
    if (changes) {
      this.updateNumSelected();
    }
    if(this.options.length > 0) {
      this.updateTitle();
    }
  }

  checkGroup(name){
    let group = this.options
        .filter((option: IMultiSelectOption) => option.group === name);
    let isChecked = false;

    if(!this.model) {
      this.model = [];
    }

    group.forEach((el) => {
      let index = this.model.indexOf(el.id);
      if(index===-1) {
        isChecked = true
      }
    })

    if(isChecked) {
      this.selectGroup(group)
    } else {
      this.deselectGroup(group)
    }
  }

  selectGroup(options) {
    for(let i = 0; i < options.length; i++) {
      let index = this.model.indexOf(options[i].id);
      if(index===-1) {
        this.model.push(options[i].id)
      }
    }
    this.onModelChange(this.model);
  }

  deselectGroup(options) {
    for(let i = 0; i < options.length; i++) {
      let index = this.model.indexOf(options[i].id);
      this.model.splice(index, 1)
    }
    this.onModelChange(this.model);
  }

  clearSearch() {
    this.searchFilterText = '';
  }

  toggleDropdown() {
    this.isVisible = !this.isVisible;
    if (!this.isVisible) {
      this.dropdownClosed.emit();
    } else {
      this.dropdownOpened.emit();
    }
  }

  isSelected(option: IMultiSelectOption): boolean {
    return this.model && this.model.indexOf(option.id) > -1;
  }

  setSelected(event: Event, option: IMultiSelectOption) {
    if (!this.model) {
      this.model = [];
    }
    var index = this.model.indexOf(option.id);
    if (index > -1) {
      this.model.splice(index, 1);
    } else {
      if (this.settings.selectionLimit === 0 || this.model.length < this.settings.selectionLimit) {
        this.model.push(option.id);
      } else {
        if (this.settings.autoUnselect) {
          this.model.push(option.id);
          this.model.shift();
        } else {
          this.selectionLimitReached.emit(this.model.length);
          return;
        }
      }
    }
    if (this.settings.closeOnSelect) {
      this.toggleDropdown();
    }
    this.onModelChange(this.model);
  }

  updateNumSelected() {
    this.numSelected = this.model && this.model.length || 0;
  }

  updateTitle() {
    if (this.numSelected === 0) {
      this.title = this.texts.defaultTitle;
    } else if (this.settings.dynamicTitleMaxItems >= this.numSelected) {
      this.title = this.options
          .filter((option: IMultiSelectOption) => this.model && this.model.indexOf(option.id) > -1)
          .map((option: IMultiSelectOption) => option.name)
          .join(', ');
    } else {
      this.title = this.numSelected + ' ' + (this.numSelected === 1 ? this.texts.checked : this.texts.checkedPlural);
    }
  }

  reset() {
    if(this.preSelected) {
      this.model = this.preSelected.map(i => i);
      this.onModelChange(this.model);
    } else {
      this.uncheckAll();
    }
  }

  checkAll() {
    this.model = this.options.map(option => option.id);
    this.onModelChange(this.model);
  }

  uncheckAll() {
    this.model = [];
    this.onModelChange(this.model);
  }
}

@NgModule({
  imports: [CommonModule, FormsModule],
  exports: [MultiselectDropdown],
  declarations: [MultiselectDropdown, MultiSelectSearchFilter],
})
export class MultiselectDropdownModule {
}

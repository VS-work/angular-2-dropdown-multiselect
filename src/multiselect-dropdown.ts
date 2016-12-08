import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { SnapshotService } from '../../services/snapshot.service';
import { StreamService } from '../../services/stream.service';
import { DecodePipe } from '../../shared/pipes/decode.pipe';
import { ToLocalTimePipe } from '../../shared/pipes/toLocalTime';
import { UserService } from '../../services/user.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { ModalDirective } from 'ng2-bootstrap/components/modal/modal.component';
import { IMultiSelectOption } from 'angular-2-dropdown-multiselect/src/multiselect-dropdown';
import { IMultiSelectSettings } from 'angular-2-dropdown-multiselect/src/multiselect-dropdown';
import 'rxjs/Rx';
import { SidebarService } from '../../services/sidebar.service';

@Component({
  selector: 'moderate',
  templateUrl: './moderate.html'
})
export class ModerateComponent implements OnInit {
  @ViewChild('trackEntryPopup') public trackEntryPopup:ModalDirective;
  @ViewChild('filterModal') public filterModal:ModalDirective;
  public entries:Array<any>;
  public classes:Array<any>;
  public streamIsSelected:boolean = true;
  public activeClient:any;
  public activeStream:any;
  public offset:number = 0;
  public pullEntryId:any;
  public isDefault:boolean;
  public filterIsApplied:boolean = false;
  public categories:any = [];
  public requestParamsFilter:any = {
    filter: {
      start: null,
      end: null,
      author: '',
      text: '',
      parent: '',
      category_class: [],
      category: [],
      assignee: [],
      queue: [],
      assigneeFilter: '',
      category_classFilter: '',
      categoryFilter: '',
      entryTypes: []
    },
    forced: 1
  };

  public filterTypesSetting:IMultiSelectSettings = {
    pullRight: false,
    enableSearch: true,
    checkedStyle: 'glyphicon',
    buttonClasses: 'btn btn-default',
    selectionLimit: 0,
    closeOnSelect: false,
    showCheckAll: true,
    showUncheckAll: true,
    dynamicTitleMaxItems: 3
  };

  private userData:any;
  private rollupStatus:string;
  private statusBar:string;
  private queryParams:any;
  private sortedStreams:any;
  private multi:any = {};
  private lastStreams:Array<any> = [];
  private loading:boolean;
  private totalRecords:any;
  private activeSort:any = {};
  private activeQueue:any = {};
  private options:Array<any> = [];
  private activeClientStageClasses:Array<any> = [];
  private queues:Array<any> = [];
  private trackPreview:any;
  private selectedOptions:number[] = [];

  private filterTypesOptions:IMultiSelectOption[] = [];

  private facebookEntryTypes: IMultiSelectOption[] = [
    { id: 1, name: 'Status', group: 'facebook', first: true },
    { id: 2, name: 'Wall', group: 'facebook', first: false },
    { id: 3, name: 'Video', group: 'facebook', first: false },
    { id: 4, name: 'Photo', group: 'facebook', first: false },
    { id: 5, name: 'Link', group: 'facebook', first: false },
    { id: 6, name: 'Album', group: 'facebook', first: false },
    { id: 7, name: 'Rating', group: 'facebook', first: false },
    { id: 8, name: 'Status Comment', group: 'facebook', first: false },
    { id: 9, name: 'Video Comment', group: 'facebook', first: false },
    { id: 10, name: 'Wall Comment', group: 'facebook', first: false },
    { id: 11, name: 'Photo Comment', group: 'facebook', first: false },
    { id: 12, name: 'Link Comment', group: 'facebook', first: false },
    { id: 13, name: 'Private Message', group: 'facebook', first: false },
    { id: 14, name: 'Conversation', group: 'facebook', first: false },
    { id: 15, name: 'Remote Mention', group: 'facebook', first: false },
    { id: 16, name: 'Remote Mention Comment', group: 'facebook', first: false }
  ];

  private instagramEntryTypes: IMultiSelectOption[] = [
    { id: 17, name: 'Video', group: 'instagram', first: true },
    { id: 18, name: 'Image', group: 'instagram', first: false },
    { id: 19, name: 'Video Comment', group: 'instagram', first: false },
    { id: 20, name: 'Image Comment', group: 'instagram', first: false },
    { id: 21, name: 'Private Message', group: 'instagram', first: false }
  ];

   private twitterEntryTypes: IMultiSelectOption[] = [
     { id: 1, name: 'Status', group: 'twitter', first: true},
     { id: 2, name: 'Reply', group: 'twitter', first: false},
     { id: 3, name: 'Reply To You', group: 'twitter', first: false},
     { id: 4, name: 'Mention', group: 'twitter', first: false },
     { id: 5, name: 'Retweet', group: 'twitter', first: false },
     { id: 6, name: 'Direct Message', group: 'twitter', first: false }
   ];

   private googleEntryTypes: IMultiSelectOption[] = [
     { id: 1, name: 'Note', group: 'google+', first: true },
     { id: 2, name: 'Note Reply', group: 'google+', first: false }
   ];

   private youtubeEntryTypes: IMultiSelectOption[] = [
     { id: 1, name: 'Video', group: 'youtube', first: true },
     { id: 2, name: 'Video Comment', group: 'youtube', first: true }
   ];

   private linkedinEntryTypes: IMultiSelectOption[] = [
     { id: 1, name: 'Status-Update', group: 'linkedin', first: true },
     { id: 2, name: 'Comment', group: 'linkedin', first: false }
   ];

   private disqusEntryTypes: IMultiSelectOption[] = [
     { id: 1, name: 'Comment', group: 'disqus', first: true },
     { id: 2, name: 'Comment', group: 'disqus', first: false }
   ];

   private viafouraEntryTypes: IMultiSelectOption[] = [
     { id: 1, name: 'Comment', group: 'viafoura', first: true }
   ];

   private datasiftEntryTypes: IMultiSelectOption[] = [
     { id: 1, name: 'Comment', group: 'datasift', first: true }
   ];

   private jetpackEntryTypes: IMultiSelectOption[] = [
     { id: 1, name: 'Post', group: 'jetpack', first: true },
     { id: 2, name: 'Post Comment', group: 'jetpack', first: false }
   ];

  public constructor(private route:ActivatedRoute, private router:Router, private snapshotService:SnapshotService,
                     private userService:UserService, public toastr:ToastsManager, public sidebarService:SidebarService,
                     private streamService:StreamService) {

    this.pullEntryId = {};
    this.activeSort = {value: 'CONTEXTUAL', name: 'Context (Default)'};
    this.options = [
      {value: 'TIME_OLDEST', name: 'Oldest First'},
      {value: 'TIME_NEWEST', name: 'Newest First'},
      {value: 'CONTEXTUAL', name: 'Context (Default)'}
    ];
    this.activeQueue = {
      accept_text: 'Accept',
      id: '-1',
      name: 'default',
      sort_order: 'CONTEXTUAL'
    };
  }
  public ngOnInit():void {
    this.router.events.subscribe((event:any) => {
      if (event instanceof NavigationEnd) {
        this.queryParams = this.route.snapshot.params;
        if (_.isEmpty(this.queryParams)) {
          this.streamIsSelected = false;
          return;
        }
        // todo: if params or route changed, prevent init if same params
        this.init(this.activeSort);
      }
    });
  }

  public changeSort(sortOption:any):void {
    this.activeSort = sortOption;
    this.init(this.activeSort);
  }

  public changeQueue(option:any):void {
    this.activeQueue = option;
    switch (this.activeQueue.sort_order) {
      case 'CONTEXTUAL':
        this.activeSort = this.options[2];
        this.init(this.activeSort);
        break;
      case 'TIME_NEWEST' :
        this.activeSort = this.options[1];
        this.init(this.activeSort);
        break;
      case 'TIME_OLDEST' :
        this.activeSort = this.options[0];
        this.init(this.activeSort);
        break;
      default:
        this.activeSort = this.options[0];
        this.init(this.activeSort);
        break;
    }
  }

  public openTrackModal():void {
    this.pullEntryId.search = '';
    this.trackPreview = null;
    this.trackEntryPopup.show();
  }

  public pullComments(entry:any):void {
    this.pullEntryId.search = (entry.source_code === 'google') ? entry.entry_url : entry.entry_url + '&id_code=' + entry.id_code;
    this.trackEntry(() => {
      let entry_id = this.trackPreview.id.split('_')[1];
      entry_id = typeof entry_id === 'undefined' ? this.trackPreview.id : entry_id;
      this.toastr.warning('Pulling comments for entry: ' + entry_id);
      this.snapshotService.pullComments(this.trackPreview, (err:any) => {
        if (err) {
          console.log(err);
        } else {
          this.toastr.success('Comments for entry: ' + entry_id + ' have been pulled');
        }
      });
    });
  }

  public trackEntry(callback:any):void {
    this.snapshotService.trackEntry(this.pullEntryId, (err:any, data:any) => {
      if (err) {
        this.toastr.error('Invalid url' + this.pullEntryId.search);
      } else {
        this.trackPreview = data.data;
        if (callback !== undefined) {
          callback();
        }
      }
    });
  }

  public cancelTrack():void {
    this.trackPreview = null;
    this.pullEntryId = {};
    this.trackEntryPopup.hide();
  }

  public addEntry():void {
    this.snapshotService.addEntry(this.trackPreview, (err:any) => {
      if (err) {
        console.log(err);
      }
      this.pullEntryId.search = '';
      this.trackPreview = null;
      this.trackEntryPopup.hide();
      this.toastr.success('Entry will be tracked');
    });
  }

  public accept():void {
    if (this.isDefault) {
      if (confirm('This will accept the current categorization and set defaults where applicable. Continue?')) {
        let posts = [];
        let accepted = [];
        // ? var status = $(this).find('.status').text().trim();
        this.entries.forEach((entry:any) => {
          if (entry.moderated && (entry.status_code === 'EDITED' || entry.status_code === 'NEW')) {
            accepted.push({stream: entry.stream.id, entry: entry.id_code});
          }
          if (!entry.moderated) {
            posts.push({stream: entry.stream.id, entry: entry.id_code});
          }
        });

        this.streamService.accept({
          id: this.activeStream.id,
          posts,
          accepted
        }, (err:any) => {
          if (!err) {
            this.refresh();
          }
        });
      }
    } else {
      this.toastr.warning('There is no default category set, cannot accept');
    }
  }

  public refresh():void {
    this.entries = [];
    this.classes = [];
    this.init(this.activeSort);
  }

  public clearAll():void {
    let cont = confirm('This will set all currently unmoderated items in the entire stream ( ' + this.totalRecords + ' posts) to the default category. This cannot be undone. Continue?');
    if (cont === true) {
      this.snapshotService.clearStream(this.queryParams.stream, (err:any) => {
        if (err) {
          console.log(err);
        }
        this.entries = [];
        this.classes = [];
        this.init(this.activeSort);
      });
    }
  }

  public processorStatus():void {

    if (this.activeStream && this.activeStream.processors) {
      let stream = '';
      let premod = '';
      for (let processor of this.activeStream.processors) {
        if (processor.processor_type === 'STREAM') {

          if (processor.status_code === 'ACTIVE' || processor.status_code === 'RUNNING') {
            stream = 'ACTIVE';
          } else if (processor.status_code === 'ERROR' || processor.status_code === 'TIMEOUT') {
            stream = 'WARNING';
          } else if (processor.status_code === 'PERM_ERROR') {
            stream = 'ERROR';
          }
        }

        if (processor.processor_type === 'PREMOD') {

          if (processor.status_code === 'ACTIVE' || processor.status_code === 'RUNNING') {
            premod = 'ACTIVE';
          } else if (processor.status_code === 'ERROR' || processor.status_code === 'TIMEOUT') {
            premod = 'WARNING';
          } else if (processor.status_code === 'PERM_ERROR') {
            premod = 'ERROR';
          }
        }
      }

      if (stream === 'ACTIVE' && premod === 'ACTIVE') {

        this.statusBar = 'ACTIVE';
      } else if ((stream === 'ACTIVE' && premod !== 'ACTIVE') || stream === 'WARNING') {
        this.statusBar = 'WARNING';
      } else if (stream === 'ERROR') {
        this.statusBar = 'ERROR';
      } else if (stream === '' && premod === '') {
        this.statusBar = 'LOADING';
      }
    }
  }

  public toggleRollUp():any {
    let client = this.activeClient;
    let rollup = parseInt(this.activeClient.rollup, 10) ? 0 : 1;
    this.snapshotService.rollAndUnroll(client, rollup, (err:any) => {
      if (err) {
        console.log(err);
      }
      client.rollup = rollup;
      this.activeClient = client;
      if (rollup === 0) {
        if (!this.lastStreams[client.id]) {
          this.activeStream = this.activeClient.streams[0];
        } else {
          this.activeStream = this.lastStreams[client.id];
        }

        this.router.navigate(['/moderate', this.activeClient.id, this.activeStream.id]);

      } else if (rollup === 1) {

        this.lastStreams[client.id] = this.activeStream;
        this.setMultiSelectOptions(this.activeClient.streams);
        this.activeStream = {id: null, source_code: null};
        this.router.navigate(['/moderate', this.activeClient.id]);

      }
    });
  }

  public loadMore():any {
    this.offset++;
    this.snapshotService.getSnapshot(this.offset, (err:any, data:any) => {
      if (err) {
        console.log(err);
      }
      this.processEntries(data);
      data.entries.forEach((entry:any) => {
        this.entries.push(entry);
      });
    });
  }

  public deepCopyClasses(data:any):any {
    let classes = [];

    data.classes.forEach((categoryClass:any) => {
      let tempClass = [];
      let key = 'categories';
      tempClass = (Object.assign({}, categoryClass));
      tempClass[key] = [];
      categoryClass.categories.forEach((tempCategory:any) => {
        tempClass[key].push(Object.assign({}, tempCategory));
      });
      classes.push(tempClass);
    });
    return classes;
  }

  public processEntries(data:any):void {
    this.activeClientStageClasses = data.premod_stage_classes;
    data.entries.forEach((entry:any) => {
      entry.author_name = (new DecodePipe() as DecodePipe).transform(entry.author_name);
      entry.entry_time = (new ToLocalTimePipe() as ToLocalTimePipe).transform(entry.entry_time);
      entry.entry_text = (new DecodePipe() as DecodePipe).transform(entry.entry_text);
      entry.author_image_url = entry.author_image_url ? entry.author_image_url.replace('http:', 'https:') : null;
      entry.classes = this.deepCopyClasses(data);
      entry.entry_data = JSON.parse(entry.entry_data);
      if (entry.categories && entry.categories.length > 0) {
        entry.categories.forEach((activeCategory:any) => {
          let activeCategories = [];
          if (activeCategory.class_code !== 'LANGUAGE') {
            activeCategories.push(activeCategory);
          }
          entry.classes.forEach((classs:any) => {
            classs.categories.forEach((category:any) => {
              if (category.code === activeCategory.category_code) {

                if (this.activeClientStageClasses.indexOf(activeCategory.user_name) > -1) {
                  category.preModSelected = true;
                } else {
                  category.selected = true;
                }
              }
            });
          });
        });
      }
    });
    return data;
  }

  public openFilter():void {
    if (this.filterTypesOptions.length === 0) {
      this.resetEntryTypesVal();
    }
    this.filterModal.show();
    if (this.requestParamsFilter.filter.category_class) {
      this.requestParamsFilter.filter.category_class.forEach((filterCategoryClass:any) => {
        let index = this.arrayObjectIndexOf(this.classes, filterCategoryClass.code, 'code');
        if (index !== -1) {
          this.classes[index].selected = true;
        }
      });
    }
  }

  public close():void {
    this.filterModal.hide();
  }

  public clear():void {
    this.selectedOptions = [];
    this.categories = [];
    this.entries = [];
    this.removeFilter('category_class');
    this.removeFilter('category');
    this.requestParamsFilter = {
      filter: {
        start: null,
        end: null,
        author: '',
        text: '',
        parent: '',
        category_class: [],
        category: [],
        assignee: [],
        queue: [],
        assigneeFilter: '',
        category_classFilter: '',
        categoryFilter: '',
        entryTypes: []
      },
      forced: 0
    };
    this.filterIsApplied = false;
    this.snapshotService.refreshSnapshot(this.queryParams.stream, this.queryParams.client, this.activeSort, this.activeQueue, undefined, (err:any, data:any) => {
      if (err) {
        console.log(err);
      }
      if (data && data.entries) {
        this.processEntries(data);
        this.totalRecords = data.total_records;
        this.entries = data.entries;
        this.classes = data.classes;
        this.activeStream = data.stream;
        this.activeClient = data.client;
        this.queues = data.queues;
        this.processorStatus();
        // this.resetEntryTypesVal();
      }
    });
  }

  public resetEntryTypesVal():void {
    switch (this.activeStream.source_code) {
      case 'FACEBOOK':
        this.filterTypesOptions = this.filterTypesOptions.concat(this.facebookEntryTypes);
        break;
      case 'INSTAGRAM':
      case 'INSTAGRAM_HASHTAG':
        this.filterTypesOptions = this.filterTypesOptions.concat(this.instagramEntryTypes);
        break;
      case 'TWITTER':
      case 'TWITTER_HASHTAG':
        this.filterTypesOptions = this.filterTypesOptions.concat(this.twitterEntryTypes);
        break;
      case 'GOOGLE':
        this.filterTypesOptions = this.filterTypesOptions.concat(this.googleEntryTypes);
        break;
      case 'YOUTUBE':
        this.filterTypesOptions = this.filterTypesOptions.concat(this.youtubeEntryTypes);
        break;
      case 'LINKEDIN':
        this.filterTypesOptions = this.filterTypesOptions.concat(this.linkedinEntryTypes);
        break;
      case 'DISQUS':
        this.filterTypesOptions = this.filterTypesOptions.concat(this.disqusEntryTypes);
        break;
      case 'VIAFOURA':
        this.filterTypesOptions = this.filterTypesOptions.concat(this.viafouraEntryTypes);
        break;
      case 'DS_DEST':
        this.filterTypesOptions = this.filterTypesOptions.concat(this.datasiftEntryTypes);
        break;
      case 'JETPACK':
        this.filterTypesOptions = this.filterTypesOptions.concat(this.jetpackEntryTypes);
        break;
      default:
        break;
    }
  }

  public filterSelectChange(selectedOptions:any):void {
    this.requestParamsFilter.filter.entryTypes = [];
    for (let i = 0; i < selectedOptions.length; i++) {
      this.requestParamsFilter.filter.entryTypes.push(this.filterTypesOptions[i]);
    }
  }

  public removeFilter(type:string):void {
    // If type is category_class or class change to empty array
    if (type === 'category_class') {
      if (type === 'category_class') {
        this.requestParamsFilter.filter.category_class = [];
      }

      this.classes.forEach((category_class:any) => {
        this.updateCategoryFilters(category_class, 'remove');
        category_class.selected = false;
      });
    } else if (type === 'category') {
      this.categories.forEach((category:any) => {
        category.selected = false;
        if (this.requestParamsFilter.filter.category.indexOf(category) !== -1) {
          this.requestParamsFilter.filter.category.splice(this.requestParamsFilter.filter.category.indexOf(category), 1);
        }
      });
    } else {
      // Else set to null
      this.requestParamsFilter.filter[type] = null;
    }
    this.requestParamsFilter.filter.isDirty = true;
  };

  public toggleFilter(type:any, value:any):void {
    let index;
    switch (type) {
      case 'category_class':
        if (value === 'all') {
          this.classes.forEach((el:any) => {
            index = this.arrayObjectIndexOf(this.requestParamsFilter.filter.category_class, el.code, 'code');
            if (index === -1) {
              this.requestParamsFilter.filter.category_class.push(el);
              el.selected = true;
              this.updateCategoryFilters(el, 'add');
            }
          });
        } else {
          index = this.arrayObjectIndexOf(this.requestParamsFilter.filter.category_class, value.code, 'code');

          // Check to see if array contains value
          // If array contains it then remove
          if (index !== -1) {
            this.requestParamsFilter.filter.category_class.splice(index, 1);
            value.selected = false;
            this.updateCategoryFilters(value, 'remove');
          } else {
            // Else push it
            this.requestParamsFilter.filter.category_class.push(value);
            value.selected = true;
            this.updateCategoryFilters(value, 'add');
          }
        }
        break;
      case 'category':
        index = this.requestParamsFilter.filter.category.indexOf(value);
        // Check to see if array contains value
        // If array contains it then remove
        if (index !== -1) {
          value.selected = false;
          this.requestParamsFilter.filter.category.splice(index, 1);
        } else {
          // Else push it
          this.requestParamsFilter.filter.category.push(value);
          value.selected = true;
        }
        break;
      default:
        this.requestParamsFilter.filter[type] = value;
        break;
    }
    this.requestParamsFilter.filter.isDirty = true;
  };

  public updateCategoryFilters(category_class:any, action:any):void {
    if (action === 'remove') {
      category_class.categories.forEach((category:any) => {
        let index = this.arrayObjectIndexOf(this.requestParamsFilter.filter.category, category.code, 'code');
        // Check to see if array contains value
        let indexCat = this.arrayObjectIndexOf(this.categories, category.code, 'code');
        // If array contains it then remove
        if (index !== -1) {
          category.selected = false;
          this.requestParamsFilter.filter.category.splice(index, 1);
        }
        if (indexCat !== -1) {
          this.categories.splice(indexCat, 1);
        }
      });
    } else {
      category_class.categories.forEach((category:any) => {
        category.selected = true;
        category.color = category_class.color;
        this.requestParamsFilter.filter.category.push(category);
        this.categories.push(category);
      });
    }
    this.requestParamsFilter.filter.isDirty = true;
  };

  public setDefaultDates():void {
    if (this.requestParamsFilter.filter.start === null) {
      let fullDate = new Date();
      let separator = '-';
      let timeStartString = 'T00:00';
      let timeEndString = 'T23:59';
      let year = fullDate.getFullYear();
      let month = ('0' + (fullDate.getMonth() + 1)).slice(-2);
      let date = ('0' + fullDate.getDate()).slice(-2);
      this.requestParamsFilter.filter.start = year + separator + month + separator + date + timeStartString;
      this.requestParamsFilter.filter.end = year + separator + month + separator + date + timeEndString;
      this.requestParamsFilter.filter.isDirty = true;
    }
  }

  public apply():void {
    this.entries = [];
    this.snapshotService.status = 'pulling';
    let sortType = this.activeSort;
    this.filterIsApplied = true;
    this.snapshotService.refreshSnapshot(this.queryParams.stream, this.queryParams.client, sortType, this.activeQueue, this.requestParamsFilter, (err:any, data:any) => {
      if (err) {
        console.log(err);
      }
      if (data && data.entries) {
        this.processEntries(data);
        this.totalRecords = data.total_records;
        this.entries = data.entries;
        this.classes = data.classes;
        this.activeStream = data.stream;
        this.activeClient = data.client;
        this.queues = data.queues;
        this.processorStatus();
      }
    });
    this.close();
  }

  private sortByKey(array:any, key:any):any {
    return array.sort((a:any, b:any) => {
      let x = a[key];
      let y = b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
  };

  private setMultiSelectOptions(streams:any):any {
    let sortedStreams = this.sortByKey(streams, 'source_code');
    let index = '';
    this.sortedStreams = [];
    this.multi.selectedStreams = [];
    sortedStreams.forEach((stream:any) => {
      if (stream.status_code === 'ACTIVE') {
        if (stream.source_code !== index) {
          if (this.sortedStreams.length > 0) {
            this.sortedStreams.push({msGroup: false});
          }
          this.sortedStreams.push({name: stream.source_code, msGroup: true});
          index = stream.source_code;
        }
        stream.ticked = true;
        this.sortedStreams.push(stream);
      }
    });
    this.sortedStreams.push({msGroup: false});
    this.multi.selectedStreams = this.sortedStreams;
  }

  private arrayObjectIndexOf(objectArray:any, searchTerm:any, property:string):number {
    if (searchTerm && searchTerm !== undefined && searchTerm !== null && objectArray && objectArray !== undefined) {
      for (let i = 0; i < objectArray.length; i++) {
        if (objectArray[i][property] === searchTerm) {
          return i;
        }
      }
    }
    return -1;
  }

  private init(sortType:any):void {
    this.userService.getUserData(false, (err:any, data:any)=> {
      if (err) {
        console.log(err);
      }
      this.userData = data;
    });
    this.entries = [];
    this.loading = true;
    this.statusBar = 'LOADING';
    this.snapshotService.refreshSnapshot(this.queryParams.stream, this.queryParams.client, sortType, this.activeQueue, undefined, (err:any, data:any) => {

      if (err) {
        console.log(err);
      }
      if (data && data.entries) {
        console.log(data);
        this.activeStream = data.stream;
        this.activeClient = data.client;
        this.isDefault = data.default;
        this.processEntries(data);
        this.totalRecords = data.total_records;
        this.entries = data.entries;
        this.classes = data.classes;
        this.queues = data.queues;
        this.processorStatus();
        this.loading = false;
      }
      if (this.activeClient) {
        this.rollupStatus = (this.activeClient.rollup === '0') ? 'ROLLUP' : 'UN-ROLL';
      }
    });
  }
}

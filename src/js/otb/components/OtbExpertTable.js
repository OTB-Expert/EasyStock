import services from "./../services/index.js"

window.Event = new Vue();

// 
const OtbTable = Vue.component("otb-expert-table", {
	props: ["heading", "message", "onConfirm", "type", "meta", "isMobile", "isPooling"],
	template: `
	<div class="v-data-table theme--light">
	  <div class="v-data-table__wrapper" style="">
			  <div>
				  <div>
					  <span v-if="meta && meta.topActions">
						  <span v-for="(action, actionIndex) in meta.topActions" :key="actionIndex">
							  <span v-if="!isMobile || action.isMobile" :class="action.boxClass">
								  <a 
									  :title="action.name" 
									  v-bind:class="action" 
									  :class="action.linkClass"
									  :href="action.link ? action.link : '#'" 
									  v-on:click="action.action ? execute(null, action) : $parent.setPage"
									  ><i :class="action.class"></i> {{ action.name }}</a>
							  </span>
						  </span>
					  </span>
				  </div>
			  </div>
			  
		  <input v-model="searchText" v-on:keyup.enter="fetchItems()"/>		
  
			  {{lastRequest}}
			  <table id="items-table" v-if="items.length > 0" class="blueTable h500" v-on:scroll.passive="handleScroll($event)">
				  <thead class="v-data-table-header">
					  <tr>
								  <th></th>
								  <th>Id</th>
								  <th v-for="(column, index) in meta.columns" :key="index" scope="col" v-on:click="sortItems(column.field)" role="columnheader" aria-label="column.name" aria-sort="none" class="text-start sortable">
									  <span> {{ column.name }} </span>
									  <i aria-hidden="true" class="v-icon notranslate mdi" :class="[sortingUp ? 'mdi-arrow-up' : 'mdi-arrow-down', sortingBy == column.field ? 'black-border' : '']" style="font-size: 18px;"></i>
								  </th>
								  <th class="min" v-if="meta.actions">Actions</th>
					  </tr>
				  </thead>
				  <tbody>
					  <tr v-for="item in filteredItems" v-bind:key="item.id" v-on:click="selectItem(item)" :class="item.selected ? 'selected' : ''">                        
						  <td class="text-start">
							  <input type="checkbox" class="checkbox" v-on:click="updateCount(item.id, item.selected)" v-model="item.selected">
						  </td>
						  <td v-on:click="updateCount(item.id, item.selected)" > {{ item.id }} </td>
						  <td style='max-height: 200px' v-for="(column, index) in meta.columns" :key="index" 
							  v-on:dblclick="editItem(item)"
							  class="text-start" v-on:click="updateCount(item.id, item.selected)" :class="[!item.active ? 'item-disabled' : item.showUntil && (new Date(item.showUntil)) < Date.now() ? 'item-expired' :  item.showFrom && (new Date(item.showFrom)) < Date.now() ? 'item-active' : '']"
							  > {{ item[column.field] | columnFormat(column.format) }} </td>
						  <td v-if="meta.actions">
							  <span v-for="(action, actionIndex) in meta.actions" class="right-10" :key="actionIndex">
								  <a 
									  :title="getState(item, action).name" 
									  :data-page="'?id=' + item.id + '#'" 
									  v-bind:class="getState(item, action)" 
									  :href="action.link ? action.link : '#'" 
									  v-on:click="execute(item, getState(item, action))"
									  ><i :class="getState(item, action).class"></i></a>
							  </span>
						  </td>
					  </tr>
				  </tbody>
			  </table>
	  </div>
  </div>
	`,
	model: {
	  event: 'edit'
	},
	data() {
	  return {
			  // isMobile: true,
			  selectedDate: new Date(),
			  items: [],
			  symbols: [],
			  updatesNeeded: 0,
			  debug: false,
			  lastRequest: null,
			  take: 20,
			  skip: 0,
			  sortingBy: null,
			  sortingUp: null,
			  searchText: "",
			  lastSearch: null,
			  selectedItemsCount: 0,
			  open: false,
			  loader: true,
			  isLoading: false,
			  isLoadingMore: false,
			  search: "",
			  selected: [],
			  response: {
				  timestamps: {
					  apiResponse: null,
					  apiRequest: null
				  }
			  }
		  };
	  },
	  mounted() {
		  this.fetchItems();
	  },
	  filters: {
		  columnFormat: (value, format) => { 
		  switch(format)
		  {
			  case 'json':
			  return JSON.stringify(value, null, 2);
			  // break;
			  case 'date':
				  var t = new Date(0, 0, 0); // Epoch
				  var h = services.util.human(t.setSeconds(value - (1900*31536000)));
				  return value ? h : '';
			  case 'unix':
				  var t = new Date(1970, 0, 1); // Epoch
				  var h = services.util.human(t.setSeconds(value));
				  return value ? h : '';
			  case 'epoch': // For IEX Cloud timestamps
				  var t = new Date(value);
				  var h = services.util.human(t);
				  return value ? h : '';
			  //break;
			  default:
			  return value;
		  }
		  }
	  },
	  computed:{
		  getState(){
			  return (item, action, state) => {
				  // var d = item.action_states.Enabled;
				  if(action.type == 1){
					  return action.states[item.action_states[action.name]];
				  }
				  else{
					  return action;
				  }
			  }
		  },
		  filteredItems() {
			  if(this.lastSearch && this.lastSearch != this.searchText)
			  {
				  this.fetchItems();
			  }
			  this.lastSearch = this.searchText;
			  return this.items.filter(item => {
				  return !this.items || !this.searchTerm 
					  || (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()))
					  || (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase()))
			  });
		  },
		  timestamp() {
			  return services.util.human(this.response.timestamps.apiResponse);
		  },		
		  elapsed() {
			  return this.response.timestamps.apiResponse - this.response.timestamps.apiRequest;
		  },
	  },
	  methods: {
		  fetchItems(context = null) 
		  {
			  if(context && !this.isPooling)
			  {
				  return;
			  }
			  if(!context)
			  {
				  context = this;
			  }
			  if(this.meta && this.meta.endpoints && this.meta.endpoints.reload.endpoint && this.meta.endpoints.reload.action == 'POST')
			  {
				  this.postItems();
			  }
			  else
			  {
				  this.getItems();
			  }
			  if(this.isPooling){
				  this.lastRequest = new Date();
				  setTimeout(function(){ context.fetchItems(context); }, this.debug ? 4000: 6000);
			  }
		  },
		  getItems() {
			  services.api.get(this, 
			  (this.meta.endpoints.reload.endpoint ? this.meta.endpoints.reload.endpoint : (this.type + "/list")), true).then(r => {
				  r.data.forEach(p=>{
					  if(this.meta && this.meta.mapping){
						  this.meta.mapping.forEach(m=>{
							  p[m[0]] = "" + p[m[1]];
						  });
					  }
					  if(!p.id)
					  {
						  p.id = p[this.type+'Id'];
					  }
					  p.selected = false;
					  p.action = { name:null, class: null };
				  });
				  this.items = r.data;
			  });
		  },
		  postItems() {
			  var meta = {};
			  var filter = { take: this.take, skip: this.skip, filter: this.searchText, skipEmpty: true };
			  services.api.post(this, 
			  (this.meta.endpoints.reload.endpoint ? this.meta.endpoints.reload.endpoint : (this.type + "/list")),
			  meta, filter, true).then(r => {
				  r.data.forEach(p=>{
					  if(this.meta && this.meta.mapping){
						  this.meta.mapping.forEach(m=>{
							  p[m[0]] = "" + p[m[1]];
						  });
					  }
					  if(!p.id)
					  {
						  p.id = p[this.type+'Id'];
					  }
					  p.action_states = {
						  isAlert: p.alert ? 1: 0,
						  isActive: p.active ? 1: 0
					  };
					  /*
					  { 	
						  action_states					
						  cycle_name: (p.active ? "Stop Polling": "Start Polling"), 
						  cycle_class: (p.active ? "glyphicon glyphicon-pause": "glyphicon glyphicon-play")
					  };
					  */
					  p.selected = false;
				  });
				  if(!this.isLoadingMore){
					  this.items = r.data;
				  }
				  else{
					  this.items = this.items.concat(r.data);
					  this.isLoadingMore = false;
				  }
			  });
		  },
		  sortItems(column) {
			  if(column == this.sortingBy)
			  {
				  this.sortingUp = !this.sortingUp;
			  }
			  else
			  {
				  this.sortingBy = column;
				  this.sortingUp = true;
			  }
		  },
		  updateCount(id, isSelected) {
			  let item = this.items.find(function(elem) {
				  return elem.id === id;
			  });
			  if (item) {
				  item.selected = !item.selected;
				  this.selectedItemsCount += isSelected ? 1 : -1;
			  }
		  },
		  openDialog() {
			  this.open = true;
		  },
		  close() {
			  this.open = false;
		  },
		  handleScroll: function (event) {
			  if(event.target.scrollHeight - event.target.scrollTop -  event.target.offsetHeight - 20 <= 0 && !this.isLoadingMore && this.items.length % this.take === 0)
			  {
				  this.isLoadingMore = true;
				  this.skip += this.take;
				  this.fetchItems();
			  }
		  },
		  selectItem: function(item) {
			  // this.selectedItem = item;
		  },
		  editItem: function(item) {
			  this.$emit('editItem', item);
			  item.selected = true;
		  },
		  switchAlert: function(item, newState)
		  {
			  item.action_states.isAlert = newState ? 1: 0;
			  if(newState){
				  services.api.get(this, "alert/" + item.id + "/resume", false);
			  }
			  else
			  {
				  services.api.get(this, "alert/" + item.id + "/suspend", false);
			  }
		  },
		  switchEnabled: function(item, newState)
		  {
			  item.action_states.isActive = newState ? 1: 0;
			  if(newState){
				  services.api.get(this, "symbol/" + item.id + "/resume", false);
			  }
			  else
			  {
				  services.api.get(this, "symbol/" + item.id + "/suspend", false);
			  }
		  },
		  execute: function(item, action) {
			  if(action.action.indexOf('execute ') == 0)
			  {
				  var options = action.action.substring(8);
				  var type = options.split(' ')[0];
				  var params = options.substring(options.indexOf(' ') + 1);
				  switch(type){
					  case 'cycle':						
						  // this[params] = !this[params];
						  // action.class = this[params] ? "glyphicon glyphicon-pause": "glyphicon glyphicon-play";
						  // action.name = this[params] ? "Stop " + action.name : action.name.substring(action.name.indexOf(' ') + 1);
						  if(this[params]){
							  if(action.action.indexOf(" isPooling") > 0){
								  this.fetchItems();
							  }
						  }
						  return;
					  case 'switch':
						  switch(params){
							  case 'active on':
								  this.switchEnabled(item, true);
								  break;
							  case 'active off':
								  this.switchEnabled(item, false);
								  break;
							  case 'alert on':
								  this.switchAlert(item, true);
								  break;
							  case 'alert off':
								  this.switchAlert(item, false);
								  break;
							  case 'local updates':
								  this.localUpdates(item, false);
								  break;
						  }
					  return;	
						  item[params] = !item[params];
						  item['action'] = {};
						  item['action'].states[params].class = item[params] ? "glyphicon glyphicon-pause": "glyphicon glyphicon-play";
						  item['action'].states[params].name = item[params] ? "Stop " + action.name : action.name;
						  // if(item[params])
						  {
							  if(action.action.indexOf(" alert") > 0){
								  this.switchAlert(item);
							  }
							  if(action.action.indexOf(" active") > 0){
								  item['action'].states[params].class = item[params] ? "glyphicon-icon-eye-close": "glyphicon-icon-eye-open";
								  item['action'].states[params].name = item[params] ? "Stop " + action.name : action.name;
								  this.switchEnabled(item);
							  }
						  }
						  return;
					  case 'request':
						  var request = this.meta.endpoints[params];
						  if(request)
						  {
							  var endpoint = request.endpoint.replace('{id}', item.id);
							  var date = moment(this.selectedDate).format('YYYY-MM-DD');
							  endpoint = endpoint.replace('{date}', date);
							  if(request.action == 'POST'){
								  services.api.get(this, endpoint, null, false);
							  }
							  if(request.action == 'GET'){
								  services.api.get(this, endpoint, false);
							  }
						  }
						  return;
				  }
				  this.$emit('execute', action.action.substring(8), item);
			  }
			  else{
				  this[action.action](item);
			  }
		  }
	}
  });

export default {
	components: {
		OtbTable
	}
}
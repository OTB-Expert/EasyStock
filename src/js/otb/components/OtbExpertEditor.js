import services from "./../services/index.js"

window.Event = new Vue();

const OtbTable = Vue.component("otb-expert-editor", {
	props: ["heading", "message", "onConfirm", "type", "meta", "selectedItem", "isMobile"],
	template: `
	<div class="v-data-table theme--light" v-on:keyup.escape="leave()">
  
	<transition name="modal">
	<div class="modal-mask">
	  <div class="modal-wrapper">
		<div class="modal-container">
  
		  <div class="modal-header">
			<slot name="header">
			  <h2>Edit {{ this.type }} <img class="size_40" v-if="isProvisioning" src="./js/otb/img/loading.svg" alt="loading"/></h2>
			</slot>
		  </div>
  
		  <div class="modal-body">
			<slot name="body" v-if="meta">
				  <template v-for="(column, index) in meta.columns">
				  <div v-if="column.editor === 'select'" class="form-group">
					  <label for="select">{{ column.name }}:</label> 
					  <div>
					  <div class="inner-addon right-addon">
						  <img class="loader glyphicon" v-if="($parent.$parent && $parent.$parent.lookup && $parent.$parent.lookup[column.lookup].isLoading) || ($parent.lookup && $parent.lookup[column.lookup])" src="./js/otb/img/loading-red.svg" alt="loading"/>
						  <input type="email" class="form-control" list="symbolsLookup" placeholder="" required v-on:change="setValue(column.name, $event.target.value)" :value="selectedId">
					  </div>
					  <span id="selectHelpBlock" class="form-text text-muted">{{ column.help }}</span>
					  </div>
				  </div>
				  <div v-if="column.editor === 'input'" class="form-group">
					  <label for="text1">{{ column.name }}:</label> 					
					  <div class="inner-addon left-addon">
						  <i class="glyphicon glyphicon-user"></i>
						  <input id="text1" name="text1" :placeholder="column.help" type="text" required="required" class="form-control">
					  </div>
					  <input id="text1" name="text1" :placeholder="column.help" type="text" required="required" class="form-control">
				  </div>
				  <div v-if="column.editor === 'checkbox'" class="form-group">
					  <label>{{ column.help }}:</label> 
					  <div>
					  <div class="custom-control custom-checkbox custom-control-inline">
						  <input name="checkbox" id="checkbox_0" type="checkbox" class="custom-control-input" value="email"> 
						  <label for="checkbox_0" class="custom-control-label">{{ column.name }}:</label>
					  </div>
					  </div>
				  </div>
			  </template>		
			</slot>
		  </div>
  
		  <div class="modal-footer">
			<slot name="footer">
								
			  <div class="form-group">
				  <button name="submit" class="btn btn-primary" v-on:click="save()">Save</button> 
				  <button class="btn btn-secondary" @click="$emit('close')" ref="inputField">
					  Cancel
				  </button>
			  </div>
			</slot>
		  </div>
		</div>
	  </div>
	</div>
  </transition>
	
	<form>
		  
	  </form>
  </div>
	`,
	style: `
	.size_40{
	  width: 40px;
	  height: 40px;
	  }
	  .size_20{
		  width: 20px;
		  height: 20px;
	  }
	`,
	model: {
	  event: 'edit'
	},
	data() {
	  return {
			  item: {},
			  open: false,
			  loader: true,
			  isProvisioning: false,
			  isLoading: false,
			  isMore: false,
			  search: "",
			  selected: [],
			  response: {
				  timestamps: {
					  apiResponse: null,
					  apiRequest: null
				  }
			  },
  
			  selectedId: null, // drop it
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
			  //break;
			  default:
			  return value;
		  }
		  }
	  },
	  computed:{
		  filteredItems() {
			  var searchTerm = this.searchText.toLowerCase();
			  return this.items.filter(item => {
				  return !this.items || !searchTerm 
					  || (item.name && item.name.toLowerCase().includes(searchTerm))
					  || (item.name && item.name.toLowerCase().includes(searchTerm))
			  });
		  },
		  timestamp() {
			  return services.util.human(this.response.timestamps.apiResponse);
		  },		
		  elapsed() {
			  return this.response.timestamps.apiResponse - this.response.timestamps.apiRequest;
		  },
	  },
	  watch: {
		  selectedItem: function () {
			  if (this.selectedItem){
				  let self = this
				  Vue.nextTick()
					  .then(function () {
						  // console.log(self.$refs.inputField	.focus())
				  })
			  }
			  this.meta.columns.forEach(column => {
				  if(column.lookup){
					  if(this.$parent.$parent){
						  if(!this.$parent.$parent.lookup[column.lookup].loaded){
							  this.isProvisioning = true;
							  this.$parent.$parent.provisionLookup(this.$parent.$parent.lookup[column.lookup]);
						  }
					  }else{
						  if(!this.$parent.lookup[column.lookup].loaded){
							  this.isProvisioning = true;
							  this.$parent.provisionLookup(this.$parent.lookup[column.lookup]);
						  }
					  }
				  }
			  });
		  }
	  },
	  methods: {
		  fetchItems() {
			  if(this.meta && this.meta.endpoints && this.meta.endpoints.reload && this.meta.endpoints.reload.endpoint && this.meta.endpoints.reload.action == 'POST')
			  {
				  this.postItems();
			  }
			  else
			  {
				  this.getItems();
			  }
		  },
		  getItems() {
			  services.api.get(this, 
			  (this.meta.endpoints.reload && this.meta.endpoints.reload.endpoint ? this.meta.endpoints.reload.endpoint : (this.type + "/list")), true).then(r => {
				  r.data.forEach(p=>{
					  if(this.meta && this.meta.mapping){
						  this.meta.mapping.forEach(m=>{
							  p[m[0]] = "" + p[m[1]];
						  });
					  }
					  if(!p.id)
					  {
						  p.id = p[type+'Id'];
					  }
					  p.selected = false;
				  });
				  this.items = r.data;
			  });
		  },
		  postItems() {
			  var endpoint = (this.meta.endpoints.reload && this.meta.endpoints.reload.endpoint ? this.meta.endpoints.reload.endpoint : (this.type + "/list"));
			  var meta = { };
			  var request = { take: this.take, skip: this.skip, filter: this.searchTerm };
			  services.api.post(this, endpoint, meta, true).then(r => {
				  r.data.forEach(p=>{
					  if(this.meta && this.meta.mapping){
						  this.meta.mapping.forEach(m=>{
							  p[m[0]] = "" + p[m[1]];
						  });
					  }
					  if(!p.id)
					  {
						  p.id = p[type+'Id'];
					  }
					  p.selected = false;
				  });
				  this.items = r.data;
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
			  if(event.target.scrollHeight - event.target.scrollTop -  event.target.offsetHeight == 0 && !this.isMore && this.items.length % this.take === 0)
			  {
				  this.isMore = true;
				  this.skip += this.take;
				  this.getItems();
			  }
		  },
		  selectItem: function(item) {
			  // this.selectedItem = item;
		  },
		  editItem: function(item) {
			  this.$emit('editItem', item);
			  item.selected = true;
		  },
		  save: function()
		  {
			  this.$emit('close');
		  },
		  leave: function()
		  {
			  this.$emit('close');
		  },
		  setValue(columnName, value){
			  this.item[columnName] = value;
		  }
	}
});


export default {
	components: {
		OtbTable
	}
}
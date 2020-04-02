import services from "./../services/index.js"

window.Event = new Vue();

// 
const OtbTable = Vue.component("otb-expert-selector", {
  props: ["heading", "message", "onConfirm", "type", "meta"]
});


export default {
	components: {
		OtbTable
	}
}
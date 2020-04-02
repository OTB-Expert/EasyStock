import services from "./../services/index.js"

window.Event = new Vue();

// 
const OtbTable = Vue.component("otb-expert-table", {
  props: ["heading", "message", "onConfirm", "type", "meta", "isMobile"]
});


export default {
	components: {
		OtbTable
	}
}
import services from "../services/index.js"

window.Event = new Vue();

// 
const OtbTable = Vue.component("otb-expert-lookup", {
	props: ["heading", "message", "onConfirm", "type", "meta", "isMobile"],
	template: ``,
	mounted() {}
});


export default {
	components: {
		OtbTable
	}
}
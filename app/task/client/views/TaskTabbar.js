import { Template } from 'meteor/templating';

import './TaskTabbar.html';

Template.tasksTabbar.helpers({
	close() {
		const { data } = Template.instance();
		const { tabBar } = data;
		return () => tabBar.close();
	},
});

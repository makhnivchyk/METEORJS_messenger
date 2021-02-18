import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';
import { ReactiveDict } from 'meteor/reactive-dict';
import { roomTypes } from '../../../../utils/client';
import { callbacks } from '../../../../callbacks/client';
import { ChatRoom, ChatSubscription } from '../../../../models/client';
import { call } from '../../../../ui-utils/client';
import { AutoComplete } from '../../../../meteor-autocomplete/client';

import './CreateTask.html';


Template.CreateTask.helpers({
	delivery() {
		if(Template.instance().state.get() == 'delivery'){
			return 1;
		}
	},
	// production() {
	// 	if(Template.instance().state.get() == 'production'){
	// 		return 1;
	// 	}
	// },
	// costs() {
	// 	if(Template.instance().state.get() == 'costs'){
	// 		return 1;
		// }
	// },

	onSelectUser() {
		return Template.instance().onSelectUser;
	},
	disabled() {
		if (Template.instance().selectParent.get()) {
			return 'disabled';
		}
	},
	targetChannelText() {
		const instance = Template.instance();
		const parentChannel = instance.parentChannel.get();
		return parentChannel && `${ TAPi18n.__('Task_target_channel_prefix') } "${ parentChannel }"`;
	},
	createIsDisabled() {
		const { parentChannel, taskName } = Template.instance();
		return parentChannel.get() && taskName.get().trim() ? '' : 'disabled';
	},
	parentChannel() {
		const instance = Template.instance();
		return instance.parentChannel.get();
	},
	selectedUsers() {
		const myUsername = Meteor.user().username;
		const { message } = this;
		const users = Template.instance().selectedUsers.get().map((e) => e);
		if (message) {
			users.unshift(message.u);
		}
		return users.filter(({ username }) => myUsername !== username);
	},

	onClickTagUser() {
		return Template.instance().onClickTagUser;
	},
	deleteLastItemUser() {
		return Template.instance().deleteLastItemUser;
	},
	onClickTagRoom() {
		return Template.instance().onClickTagRoom;
	},
	deleteLastItemRoom() {
		return Template.instance().deleteLastItemRoom;
	},
	selectedRoom() {
		return Template.instance().selectedRoom.get();
	},
	onSelectRoom() {
		return Template.instance().onSelectRoom;
	},
	roomCollection() {
		return ChatRoom;
	},
	roomSelector() {
		return (expression) => ({ name: { $regex: `.*${ expression }.*` } });
	},
	roomModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `#${ f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	userModifier() {
		return (filter, text = '') => {
			const f = filter.get();
			return `@${ f.length === 0 ? text : text.replace(new RegExp(filter.get(), 'i'), (part) => `<strong>${ part }</strong>`) }`;
		};
	},
	nameSuggestion() {
		return Template.instance().taskName.get();
	},
});

Template.CreateTask.events({
	'input #task_name'(e, t) {
		t.taskName.set(e.target.value);
	},
	'input #task_message'(e, t) {
		const { value } = e.target;
		t.reply.set(value);
	},
	'change #select_task_type'(e, t){
		var tp = $(e.currentTarget).val();
		t.state.set (tp);
	},
	async 'submit #create-task, click .js-save-task'(event, instance) {
		event.preventDefault();
		const parentChannel = instance.parentChannel.get();

		const { pmid } = instance;
		const taskt_name = instance.taskName.get();
		const users = instance.selectedUsers.get().map(({ username }) => username).filter((value, index, self) => self.indexOf(value) === index);

		const isTask = instance.parentChannelId.get();
		const reply = instance.reply.get();

		if (!isTask) {
			const errorText = TAPi18n.__('Invalid_room_name', `${ parentChannel }...`);
			return toastr.error(errorText);
		}
		const result = await call('createTask', { isTask, pmid, taskt_name, reply, users });
		// callback to enable tracking
		callbacks.run('afterTask', Meteor.user(), result);

		if (instance.data.onCreate) {
			instance.data.onCreate(result);
		}

		roomTypes.openRouteLink(result.t, result);
	},
});

Template.CreateTask.onRendered(function() {
	this.find(this.data.rid ? '#task_name' : '#parentChannel').focus();
})

const suggestName = (msg = '') => msg.substr(0, 140);

Template.CreateTask.onCreated(function() {
	this.state = new ReactiveVar(false);

	const { rid, message: msg } = this.data;

	const parentRoom = rid && ChatSubscription.findOne({ rid });

	// if creating a discussion from inside a discussion, uses the same channel as parent channel
	const room = parentRoom && parentRoom.isTask ? ChatSubscription.findOne({ rid: parentRoom.isTask }) : parentRoom;

	if (room) {
		room.text = room.name;
	}

	const roomName = room && roomTypes.getRoomName(room.t, room);
	this.taskName = new ReactiveVar(suggestName(msg && msg.msg));

	this.pmid = msg && msg._id;

	this.parentChannel = new ReactiveVar(roomName);
	this.parentChannelId = new ReactiveVar(room && room.rid);

	this.selectParent = new ReactiveVar(room && room.rid);

	this.reply = new ReactiveVar('');



	this.selectedRoom = new ReactiveVar(room ? [room] : []);


	this.onClickTagRoom = () => {
		this.selectedRoom.set([]);
	};
	this.deleteLastItemRoom = () => {
		this.selectedRoom.set([]);
	};

	this.onSelectRoom = ({ item: room }) => {
		room.text = room.name;
		this.selectedRoom.set([room]);
	};

	this.autorun(() => {
		const [room = {}] = this.selectedRoom.get();
		this.parentChannel.set(roomTypes.getRoomName(room.t, room)); // determine parent Channel from setting and allow to overwrite
		this.parentChannelId.set(room && (room.rid || room._id));
	});

	this.selectedUsers = new ReactiveVar([]);
	this.onSelectUser = ({ item: user }) => {
		if (user.username === (msg && msg.u.username)) {
			return;
		}

		if (user.username === Meteor.user().username) {
			return;
		}
		const users = this.selectedUsers.get();
		if (!users.find((u) => user.username === u.username)) {
			this.selectedUsers.set([...users, user]);
		}
	};
	this.onClickTagUser = ({ username }) => {
		this.selectedUsers.set(this.selectedUsers.get().filter((user) => user.username !== username));
	};
	this.deleteLastItemUser = () => {
		const arr = this.selectedUsers.get();
		arr.pop();
		this.selectedUsers.set(arr);
	};

	// callback to allow setting a parent Channel or e. g. tracking the event using Piwik or GA
	const { parentChannel, reply } = callbacks.run('openTaskCreationScreen') || {};

	if (parentChannel) {
		this.parentChannel.set(parentChannel);
	}
	if (reply) {
		this.reply.set(reply);
	}
});

Template.SearchCreateTask.helpers({
	list() {
		return this.list;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	config() {
		const { filter } = Template.instance();
		const { noMatchTemplate, templateItem, modifier } = Template.instance().data;
		return {
			filter: filter.get(),
			template_item: templateItem,
			noMatchTemplate,
			modifier(text) {
				return modifier(filter, text);
			},
		};
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
});

Template.SearchCreateTask.events({
	'input input'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);
		t.filter.set(input.value);
	},
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'keydown input'(e, t) {
		t.ac.onKeyDown(e);
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const { deleteLastItem } = t;
			return deleteLastItem && deleteLastItem();
		}
	},
	'keyup input'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus input'(e, t) {
		t.ac.onFocus(e);
	},
	'blur input'(e, t) {
		t.ac.onBlur(e);
	},
	'click .rc-tags__tag'({ target }, t) {
		const { onClickTag } = t;
		return onClickTag & onClickTag(Blaze.getData(target));
	},
});
Template.SearchCreateTask.onRendered(function() {
	const { name } = this.data;

	this.ac.element = this.firstNode.querySelector(`[name=${ name }]`);
	this.ac.$element = $(this.ac.element);
});

Template.SearchCreateTask.onCreated(function() {
	this.filter = new ReactiveVar('');
	this.selected = new ReactiveVar([]);
	this.onClickTag = this.data.onClickTag;
	this.deleteLastItem = this.data.deleteLastItem;
	

	const { collection, endpoint, field, sort, onSelect, selector = (match) => ({ term: match }) } = this.data;
	this.ac = new AutoComplete(
		{
			selector: {
				anchor: '.rc-input__label',
				item: '.rc-popup-list__item',
				container: '.rc-popup-list__list',
			},
			onSelect,
			position: 'fixed',
			limit: 10,
			inputDelay: 300,
			rules: [
				{
					collection,
					endpoint,
					field,
					matchAll: true,
					// filter,
					doNotChangeWidth: false,
					selector,
					sort,
				},
			],

		});
	this.ac.tmplInst = this;
});

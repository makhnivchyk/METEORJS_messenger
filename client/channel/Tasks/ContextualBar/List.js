import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import s from 'underscore.string';
import React, { useCallback, useMemo, useState, useEffect, useRef, memo } from 'react';
import { Box, Icon, TextInput, Callout } from '@rocket.chat/fuselage';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useDebouncedValue, useDebouncedState, useResizeObserver } from '@rocket.chat/fuselage-hooks';

import { renderMessageBody } from '../../../../app/ui-utils/client';
import { getConfig } from '../../../../app/ui-utils/client/config';
import { Messages } from '../../../../app/models/client';
import VerticalBar from '../../../components/basic/VerticalBar';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useUserId, useUserSubscription } from '../../../contexts/UserContext';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { MessageSkeleton } from '../../components/Message';
import { useUserRoom } from '../../hooks/useUserRoom';
import { useSetting } from '../../../contexts/SettingsContext';
import TaskListMessage from './components/Message';
import { clickableItem } from '../../helpers/clickableItem';

function mapProps(WrappedComponent) {
	return ({ msg, username, tcount, ts, ...props }) => <WrappedComponent replies={tcount} username={username} msg={msg} ts={ts} {...props}/>;
}

const Task = React.memo(mapProps(clickableItem(TaskListMessage)));

const Skeleton = React.memo(clickableItem(MessageSkeleton));

const LIST_SIZE = parseInt(getConfig('taskListSize')) || 25;

const filterProps = ({ msg, drid, u, dcount, mentions, tcount, ts, _id, dlm, attachments, name }) => ({ ..._id && { _id }, drid, attachments, name, mentions, msg, u, dcount, tcount, ts: new Date(ts), dlm: new Date(dlm) });

const subscriptionFields = { tunread: 1, tunreadUser: 1, tunreadGroup: 1 };
const roomFields = { t: 1, name: 1 };

export function withData(WrappedComponent) {
	return ({ rid, ...props }) => {
		const room = useUserRoom(rid, roomFields);
		const subscription = useUserSubscription(rid, subscriptionFields);
		const userId = useUserId();

		const [text, setText] = useState('');
		const [total, setTotal] = useState(LIST_SIZE);
		const [tasks, setTasks] = useDebouncedState([], 100);
		const Tasks = useRef(new Mongo.Collection(null));
		const ref = useRef();
		const [pagination, setPagination] = useState({ skip: 0, count: LIST_SIZE });

		const params = useMemo(() => ({ roomId: room._id, count: pagination.count, offset: pagination.skip, text }), [room._id, pagination.skip, pagination.count, text]);

		const { data, state, error } = useEndpointDataExperimental('chat.getTasks', useDebouncedValue(params, 400));

		const loadMoreItems = useCallback((skip, count) => {
			setPagination({ skip, count: count - skip });

			return new Promise((resolve) => { ref.current = resolve; });
		}, []);

		useEffect(() => () => Tasks.current.remove({}, () => {}), [text]);

		useEffect(() => {
			if (state !== ENDPOINT_STATES.DONE || !data || !data.messages) {
				return;
			}

			data.messages.forEach(({ _id, ...message }) => {
				Tasks.current.upsert({ _id }, filterProps(message));
			});

			setTotal(data.total);
			ref.current && ref.current();
		}, [data, state]);

		useEffect(() => {
			const cursor = Messages.find({ rid: room._id, drid: { $exists: true } }).observe({
				added: ({ _id, ...message }) => {
					Tasks.current.upsert({ _id }, message);
				}, // Update message to re-render DOM
				changed: ({ _id, ...message }) => {
					Tasks.current.update({ _id }, message);
				}, // Update message to re-render DOM
				removed: ({ _id }) => {
					Tasks.current.remove(_id);
				},
			});
			return () => cursor.stop();
		}, [room._id]);


		useEffect(() => {
			const cursor = Tracker.autorun(() => {
				const query = {
				};
				setTasks(Tasks.current.find(query, { sort: { tlm: -1 } }).fetch().map(filterProps));
			});

			return () => cursor.stop();
		}, [room._id, setTasks, userId]);

		const handleTextChange = useCallback((e) => {
			setPagination({ skip: 0, count: LIST_SIZE });
			setText(e.currentTarget.value);
		}, []);

		return <WrappedComponent
			{...props}
			unread={subscription?.tunread}
			unreadUser={subscription?.tunreadUser}
			unreadGroup={subscription?.tunreadGroup}
			userId={userId}
			error={error}
			tasks={tasks}
			total={total}
			loading={state === ENDPOINT_STATES.LOADING}
			loadMoreItems={loadMoreItems}
			room={room}
			text={text}
			setText={handleTextChange}
		/>;
	};
}

export const normalizeThreadMessage = ({ ...message }) => {
	if (message.msg) {
		return renderMessageBody(message).replace(/<br\s?\\?>/g, ' ');
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return s.escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return s.escapeHTML(attachment.title);
		}
	}
};

const Row = memo(function Row({
	data,
	index,
	style,
	showRealNames,
	userId,
	onClick,
}) {
	const t = useTranslation();
	const formatDate = useTimeAgo();

	if (!data[index]) {
		return <Skeleton style={style}/>;
	}
	const task = data[index];
	const msg = normalizeThreadMessage(task);

	const { name = task.u.username } = task.u;

	return <Task
		{ ...task }
		name={showRealNames ? name : task.u.username }
		username={ task.u.username }
		style={style}
		following={task.replies && task.replies.includes(userId)}
		data-drid={task.drid}
		msg={msg}
		t={t}
		formatDate={formatDate}
		onClick={onClick}
	/>;
});

export function TaskList({ total = 10, tasks = [], loadMoreItems, loading, onClose, error, userId, text, setText }) {
	const showRealNames = useSetting('UI_Use_Real_Name');
	const tasksRef = useRef();

	const t = useTranslation();

	const onClick = useCallback((e) => {
		const { drid } = e.currentTarget.dataset;
		FlowRouter.goToRoomById(drid);
	}, []);

	tasksRef.current = tasks;

	const rowRenderer = useCallback(({ data, index, style }) => <Row
		data={data}
		index={index}
		style={style}
		showRealNames={showRealNames}
		userId={userId}
		onClick={onClick}
	/>, [onClick, showRealNames, userId]);

	const isItemLoaded = useCallback((index) => index < tasksRef.current.length, []);
	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 750 } = {} } = useResizeObserver();

	return <VerticalBar>
		<VerticalBar.Header>
			<VerticalBar.Icon name='bell'/>
			<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>{t('Tasks')}</Box>
			<VerticalBar.Close onClick={onClose}/>
		</VerticalBar.Header>
		<VerticalBar.Content paddingInline={0}>
			<Box display='flex' flexDirection='row' p='x24' borderBlockEndWidth='x2' borderBlockEndStyle='solid' borderBlockEndColor='neutral-200' flexShrink={0}>
				<TextInput placeholder={t('Search_Messages')} value={text} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
			</Box>
			<Box flexGrow={1} flexShrink={1} ref={ref}>
				{error && <Callout mi='x24' type='danger'>{error.toString()}</Callout>}
				{total === 0 && <Box p='x24'>{t('No_Tasks_found')}</Box>}
				<InfiniteLoader
					isItemLoaded={isItemLoaded}
					itemCount={total}
					loadMoreItems={ loading ? () => {} : loadMoreItems}
				>
					{({ onItemsRendered, ref }) => (<List
						height={blockSize}
						width={inlineSize}
						itemCount={total}
						itemData={tasks}
						itemSize={124}
						ref={ref}
						minimumBatchSize={LIST_SIZE}
						onItemsRendered={onItemsRendered}
					>{rowRenderer}</List>
					)}
				</InfiniteLoader>
			</Box>
		</VerticalBar.Content>
	</VerticalBar>;
}

export default withData(TaskList);

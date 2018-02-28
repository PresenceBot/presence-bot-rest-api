const moment = require('moment');

const database = require('./database');

const QUERY_GET_ACTIVITY = 'SELECT "name", "data", "timestamp" FROM public."Event" WHERE timestamp > (current_timestamp - ($1 || \' day\')::INTERVAL)';

module.exports = {
    validateApiKey: (guildId, key) => Promise.resolve(true),

    getActivity: (guildId, {
        users = null,
        groupBy = 'week',
        period = 14,
        granularity = 'hour',
        timeZone = 0
    } = {}) => {
        return database.query(QUERY_GET_ACTIVITY, [period]).then(({rows}) => {
            // Grab only PRESENCE_UPDATES for the given guild
            const presenceEvents = rows
                .filter(({name, data}) => name === 'PRESENCE_UPDATE' && data.guild_id === guildId)
                .map(({data: {
                    nick,
                    user: {id},
                    status
                }, timestamp}) => ({
                    nick,
                    id,
                    status,
                    timestamp
                }))

            const users = {};
            const getUser = (id, nick) => {
                const user = users[id] || (users[id] = { activity: [] })
                user.nick = nick;
                return user;
            };

            // Group events by username
            presenceEvents.forEach(({id, nick, status, timestamp}) => {
                const {activity} = getUser(id, nick);
                // Remove duplicate statuses (ignoring games)
                if(activity.length === 0 || activity[activity.length - 1].status !== status) {
                    activity.push({
                        timestamp: +moment(timestamp),
                        status
                    });
                }
            });

            // Create a sequence of timestamps representing the period
            // we care about, bucketed by the specified granularity
            const interval = +moment.duration(1, granularity);
            const startOfPeriod = moment().startOf(groupBy);
            const endOfPeriod = moment().endOf(groupBy);
            let nextTime = startOfPeriod;
            const timeArr = [];
            do {
                timeArr.push(+nextTime);
                nextTime = moment(nextTime).add(interval);
            } while(nextTime < endOfPeriod);

            // Helper function for determining the amount of time (in milliseconds)
            // that two time intervals overlap.
            const getOverlap = (start1, end1, start2, end2) => {
                if(start1 > end2 || start2 > end1) {
                    return 0;
                } else {
                    return Math.min(end1, end2) - Math.max(start1, start2);
                }
            };

            // Bucket user activity by granularity
            const userActivity = Object.entries(users).map(([id, {nick, activity}]) => {
                let block = activity.shift();

                const peekTime = () => activity.length > 0 ? activity[0].timestamp : Infinity;

                const bucketedTime = timeArr.map(startTime => {
                    const endTime = startTime + interval;
                    const durations = { offline: 0, online: 0, dnd: 0, idle: 0 };
                    while(block != null && block.timestamp < endTime) {
                        const {timestamp, status} = block;
                        const overlap = getOverlap(timestamp, peekTime(), startTime, endTime);
                        durations[status] += overlap;
                        if(peekTime() > endTime) {
                            return durations;
                        } else {
                            block = activity.shift();
                        }
                    }
                    return durations;
                });

                return {
                    id,
                    nick,
                    activity: bucketedTime
                }
            });

            return {
                intervals: timeArr,
                timeZone,
                activity: userActivity
            }
        });
    }
};

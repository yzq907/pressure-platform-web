import request from '../utils/request';

export const addScheduledTask = (body: any) => {
    return request({
        url: '/scheduledTask/add',
        method: 'post',
        data: body
    });
};

export const updateScheduledTask = (id: number, body: any) => {
    return request({
        url: '/scheduledTask/update/' + id,
        method: 'post',
        data: body
    });
};

export const deleteScheduledTask = (id: number) => {
    return request({
        url: '/scheduledTask/delete/' + id,
        method: 'get'
    });
};

export const toggleScheduledTask = (id: number, enabled: number) => {
    return request({
        url: '/scheduledTask/toggle/' + id,
        method: 'get',
        params: { enabled }
    });
};

export const listScheduledTasks = (query: any) => {
    return request({
        url: '/scheduledTask/list',
        method: 'get',
        params: query
    });
};

export const listScheduledTaskLogs = (query: any) => {
    return request({
        url: '/scheduledTask/logs',
        method: 'get',
        params: query
    });
};

export const listScheduledTasksByTestCase = (testCaseId: number) => {
    return request({
        url: '/scheduledTask/listByTestCase/' + testCaseId,
        method: 'get'
    });
};

export const triggerScheduledTask = (id: number) => {
    return request({
        url: '/scheduledTask/trigger/' + id,
        method: 'get'
    });
};

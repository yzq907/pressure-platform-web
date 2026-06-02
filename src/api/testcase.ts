import request from '../utils/request';

export const addTestCase = (body: any) => {
    return request({
        url: '/testcase/add',
        method: 'post',
        data: body
    })
}

export const updateTestCase = (id: number, body: any) => {
    return request({
        url: '/testcase/update/' + id,
        method: 'post',
        data: body
    })
}

export const getTestCaseList = (param: any) => {
    return request({
        url: '/testcase/list',
        method: 'get',
        params: param
    });
}

export const getTestCaseStats = (param: any) => {
    return request({
        url: '/testcase/stats',
        method: 'get',
        params: param
    });
}

export const getFull = (id: number) => {
    return request({
        url: '/testcase/getFull/' + id,
        method: 'get'
    });
}

export const deleteTestCase = (id: number) => {
    return request({
        url: '/testcase/delete/' + id,
        method: 'get'
    });
}

export const batchDeleteTestCase = (id: number) => {
    return request({
        url: '/testcase/batchDelete/' + id,
        method: 'get'
    });
}

export const debugTestCase = (id: number) => {
    return request({
        url: '/testcase/debug/' + id,
        method: 'get'
    });
}

export const startTestCase = (id: number, body: any) => {
    return request({
        url: '/testcase/run/' + id,
        method: 'post',
        data: body
    });
}

export const getRunThreadGroups = (id: number) => {
    return request({
        url: '/testcase/runThreadGroups/' + id,
        method: 'get'
    });
}

export const stopTestCase = (id: number) => {
    return request({
        url: '/testcase/stop/' + id,
        method: 'get'
    });
}

export const stopExecution = (reportId: number) => {
    return request({
        url: '/testcase/stopExecution/' + reportId,
        method: 'get'
    });
}

export const getExecutionQueue = (param: any) => {
    return request({
        url: '/testcase/executionQueue',
        method: 'get',
        params: param
    });
}

export const cancelQueuedExecution = (queueId: number) => {
    return request({
        url: '/testcase/cancelQueuedExecution/' + queueId,
        method: 'get'
    });
}

export const syncNode = (nodeId: number) => {
    return request({
        url: '/testcase/syncNode/' + nodeId,
        method: 'get'
    });
}


export const getResult = (id: number) => {
    return request({
        url: '/testcase/getJMeterResult/' + id,
        method: 'get'
    });
}
